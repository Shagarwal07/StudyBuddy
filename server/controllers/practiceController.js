/**
 * practiceController.js
 * Lean Express Request/Response Controller for Coding Practice & Roadmaps.
 * Heavy in-memory datasets, CSV parsers, and resolvers offloaded to practiceDataService.js & urlParser.js.
 */
const User = require("../models/User");
const UserCodingProgress = require("../models/UserCodingProgress");
const GlobalSheet = require("../models/GlobalSheet");
const ProblemSolution = require("../models/ProblemSolution");
const DailyActivity = require("../models/DailyActivity");
const ProblemNote = require("../models/ProblemNote");
const { getLocalDateString } = require("../utils/dateUtils");
const {
  normalize, cleanProblemTitle, isPracticeJudgeUrl, isInstructorResourceUrl, parseCodeforcesUrl, extractTitleFromUrl, detectPlatform,
} = require("../utils/urlParser");
const {
  findProblemInDatabase, resolveProblemItem, parseCsvProblems, getFallbackSheet, formatSheetResponse, getProblemSolutionData, extractProblemsFromInput, generateAiSolutionData, compileSheetsForUser, handleProblemToggle,
} = require("../services/practiceDataService");

const inFlightAiGenerations = new Map();

async function getUserProgress(userId) {
  let progress = await UserCodingProgress.findOne({ userId });
  if (!progress) {
    progress = await UserCodingProgress.create({
      userId,
      solvedProblemKeys: [],
      starredProblemKeys: [],
      activeSheets: ["strivers-180"],
      customSheets: [],
    });
  }
  return progress;
}

// 1. GET /api/practice/sheets
exports.getSheets = async (req, res) => {
  try {
    const progress = await getUserProgress(req.user.id);
    const result = await compileSheetsForUser(progress);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("[Practice:getSheets]", error.message);
    res.status(500).json({ success: false, message: "Failed to load sheets" });
  }
};

// 2. POST /api/practice/enroll
exports.enrollSheet = async (req, res) => {
  try {
    const { sheetId } = req.body;
    if (!sheetId) return res.status(400).json({ success: false, message: "sheetId is required" });
    const progress = await UserCodingProgress.findOneAndUpdate(
      { userId: req.user.id },
      { $addToSet: { activeSheets: sheetId } },
      { upsert: true, returnDocument: "after" }
    );
    res.json({ success: true, message: "Enrolled in sheet", activeSheets: progress?.activeSheets || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to enroll in sheet" });
  }
};

// 3. POST /api/practice/unenroll
exports.unenrollSheet = async (req, res) => {
  try {
    const { sheetId } = req.body;
    if (!sheetId) return res.status(400).json({ success: false, message: "sheetId is required" });
    const progress = await UserCodingProgress.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { activeSheets: sheetId } },
      { returnDocument: "after" }
    );
    res.json({ success: true, message: "Removed sheet from practice", activeSheets: progress?.activeSheets || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove sheet" });
  }
};

// 4. GET /api/practice/sheet/:sheetId
exports.getSheetDetails = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const progress = await getUserProgress(req.user.id);
    const solvedSet = new Set(progress.solvedProblemKeys || []);
    const starredSet = new Set(progress.starredProblemKeys || []);
    const sheet = (await GlobalSheet.findOne({ id: sheetId }).lean().catch(() => null)) ||
      getFallbackSheet(sheetId) ||
      (progress.customSheets || []).find((cs) => cs.id === sheetId);
    if (!sheet) return res.status(404).json({ success: false, message: "Sheet not found" });
    res.json(formatSheetResponse(sheet, solvedSet, starredSet));
  } catch (error) {
    console.error("[Practice:getSheetDetails]", error.message);
    res.status(500).json({ success: false, message: "Failed to load sheet details" });
  }
};

// 5. GET /api/practice/solution/:problemKey
exports.getProblemSolution = async (req, res) => {
  try {
    const data = await getProblemSolutionData({
      problemKey: req.params.problemKey,
      querySlug: req.query.slug,
      queryId: req.query.id,
      queryTufHref: req.query.tufHref,
      queryPlatform: req.query.platform,
    });
    return res.json(data);
  } catch (error) {
    console.error("[Practice:getProblemSolution]", error.message);
    res.status(500).json({ success: false, message: "Failed to load solution" });
  }
};

// 6. POST /api/practice/solution/save-ai
exports.saveAiSolution = async (req, res) => {
  try {
    const { problemKey, slug, approachName, lang, code } = req.body;
    if (!problemKey && !slug) return res.status(400).json({ success: false, message: "problemKey or slug is required" });
    if (!approachName || !lang || !code) return res.status(400).json({ success: false, message: "approachName, lang (cpp/python), and code are required" });
    const cleanLang = String(lang).toLowerCase().trim();
    if (!["cpp", "python"].includes(cleanLang)) return res.status(400).json({ success: false, message: "AI standalone solutions can only be saved for cpp or python" });

    const targetKey = normalize(slug || problemKey);
    await ProblemSolution.findOneAndUpdate(
      { key: targetKey, slug: targetKey, isAiGenerated: true },
      { $set: { title: cleanProblemTitle(problemKey) || problemKey, isAiGenerated: true, aiModel: "gemini", defaultCode: code } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, message: `Saved ${cleanLang.toUpperCase()} for ${approachName} in ProblemSolution store`, targetKey });
  } catch (error) {
    console.error("[Practice:saveAiSolution]", error.message);
    res.status(500).json({ success: false, message: "Failed to save AI solution" });
  }
};

// 7. POST /api/practice/solution/generate-ai
exports.generateAiSolution = async (req, res) => {
  const { problemKey, slug, title, approachName, lang, baseCode, timeComplexity, spaceComplexity, explanation, isOfficialFull } = req.body;
  if (!problemKey && !slug) return res.status(400).json({ success: false, message: "problemKey or slug is required" });

  const cleanLang = String(lang || "").toLowerCase().trim();
  const isOfficialHarness = Boolean(isOfficialFull || approachName?.includes("★") || approachName?.toLowerCase().includes("official"));
  const targetApproach = isOfficialHarness ? "★ Official - Full" : (approachName || "Optimal");
  const allowedLangs = isOfficialHarness ? ["cpp", "python", "java"] : ["cpp", "python"];
  if (!allowedLangs.includes(cleanLang)) {
    return res.status(400).json({ success: false, message: `AI generation for ${targetApproach} is only available for ${allowedLangs.join(", ")}` });
  }

  const targetSlug = normalize(slug || problemKey);
  const flightKey = `${targetSlug}:${targetApproach}:${cleanLang}`;
  if (inFlightAiGenerations.has(flightKey)) {
    try {
      const code = await inFlightAiGenerations.get(flightKey);
      return res.json({ success: true, code, lang: cleanLang, approachName: targetApproach, isOfficialFull: isOfficialHarness });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  const generationPromise = generateAiSolutionData({
    problemKey, slug, title, targetApproach, cleanLang, isOfficialHarness, baseCode, timeComplexity, spaceComplexity, explanation, customApiKey: req.body.customApiKey || null,
  });
  inFlightAiGenerations.set(flightKey, generationPromise);

  try {
    const finalCode = await generationPromise;
    return res.json({ success: true, code: finalCode, lang: cleanLang, approachName: targetApproach, isOfficialFull: isOfficialHarness });
  } catch (error) {
    console.error("[Practice:generateAiSolution]", error.message);
    const isRateLimited = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED");
    return res.status(isRateLimited ? 429 : 500).json({ success: false, message: isRateLimited ? "AI service is currently busy. Please wait 30 seconds." : "Failed to generate solution: " + error.message });
  } finally {
    inFlightAiGenerations.delete(flightKey);
  }
};

// 8. POST /api/practice/toggle-status
exports.toggleProblemStatus = async (req, res) => {
  try {
    const { problemKey, action, title, leetcodeSlug, leetcodeId, id } = req.body;
    if (!problemKey) return res.status(400).json({ success: false, message: "problemKey is required" });
    const result = await handleProblemToggle({ userId: req.user.id, problemKey, action, title, leetcodeSlug, leetcodeId, id });
    return res.json(result);
  } catch (error) {
    console.error("[Practice:toggleProblemStatus]", error.message);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

// 9. POST /api/practice/toggle-starred
exports.toggleProblemStarred = async (req, res) => {
  try {
    const { problemKey } = req.body;
    if (!problemKey) return res.status(400).json({ success: false, message: "problemKey is required" });
    const normKey = normalize(problemKey);
    const progress = await getUserProgress(req.user.id);
    const isStarred = (progress.starredProblemKeys || []).includes(normKey);
    await UserCodingProgress.updateOne(
      { userId: req.user.id },
      isStarred ? { $pull: { starredProblemKeys: normKey } } : { $addToSet: { starredProblemKeys: normKey } }
    );
    res.json({ success: true, isStarred: !isStarred });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle star" });
  }
};

// 10. POST /api/practice/custom-sheet
exports.createCustomSheet = async (req, res) => {
  try {
    const { title, description, sheetUrl, fileBase64, mimeType, fileName, geminiApiKey, rawProblems } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: "Sheet title is required" });
    const { enrichedProblems, sheetSource } = await extractProblemsFromInput({ sheetUrl, fileBase64, mimeType, fileName, geminiApiKey, rawProblems });
    if (!enrichedProblems?.length) return res.status(400).json({ success: false, message: "No problems extracted from source." });

    const customId = `custom-${Date.now()}`;
    const newCustomSheet = { id: customId, title: title.trim(), description: description?.trim() || `Synced with ${sheetSource} (${enrichedProblems.length} problems)`, sourceUrl: sheetUrl?.trim() || "", lastSyncedAt: sheetUrl?.trim() ? new Date() : null, problems: enrichedProblems };

    if (req.body.isGlobal || req.body.publishAsDeveloper) {
      const adminUser = await User.findById(req.user.id).select("role username").lean();
      if (adminUser?.role === "admin") {
        await GlobalSheet.findOneAndUpdate(
          { id: customId },
          { ...newCustomSheet, category: req.body.category || "DSA Patterns", group: req.body.group || "dsa", badge: req.body.badge || "Developer / Admin", uploadedBy: { name: adminUser.username || "Developer / Admin", role: "admin", userId: req.user.id }, isOfficial: true },
          { upsert: true, returnDocument: "after" }
        );
      }
    }
    await UserCodingProgress.findOneAndUpdate({ userId: req.user.id }, { $push: { customSheets: newCustomSheet }, $addToSet: { activeSheets: customId } }, { upsert: true, returnDocument: "after" });
    res.json({ success: true, message: `Roadmap "${title.trim()}" created with ${enrichedProblems.length} problems`, sheetId: customId, sheet: newCustomSheet, count: enrichedProblems.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to create custom sheet" });
  }
};

// 11. POST /api/practice/custom-sheet/sync
exports.syncCustomSheet = async (req, res) => {
  try {
    const { sheetId, sheetUrl, geminiApiKey } = req.body;
    if (!sheetId) return res.status(400).json({ success: false, message: "Sheet ID is required" });
    let globalSheet = await GlobalSheet.findOne({ id: sheetId });
    const targetUrl = sheetUrl?.trim() || globalSheet?.sourceUrl;
    if (!targetUrl) return res.status(400).json({ success: false, message: "No cloud source URL found to sync." });

    const { enrichedProblems } = await extractProblemsFromInput({ sheetUrl: targetUrl, geminiApiKey });
    if (!enrichedProblems?.length) return res.status(400).json({ success: false, message: "No problems extracted during sync." });

    if (globalSheet) {
      globalSheet.problems = enrichedProblems;
      globalSheet.lastSyncedAt = new Date();
      await globalSheet.save();
      return res.json({ success: true, message: `Roadmap "${globalSheet.title}" synced!`, sheet: globalSheet, count: enrichedProblems.length });
    }

    const progress = await UserCodingProgress.findOne({ userId: req.user.id });
    const customSheet = (progress?.customSheets || []).find((cs) => cs.id === sheetId);
    if (!customSheet) return res.status(404).json({ success: false, message: "Roadmap not found" });

    customSheet.problems = enrichedProblems;
    customSheet.lastSyncedAt = new Date();
    await progress.save();
    res.json({ success: true, message: `Roadmap "${customSheet.title}" synced!`, sheet: customSheet, count: enrichedProblems.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to sync roadmap" });
  }
};

// 12. DELETE /api/practice/custom-sheet/:sheetId
exports.deleteCustomSheet = async (req, res) => {
  try {
    const { sheetId } = req.params;
    if (!sheetId) return res.status(400).json({ success: false, message: "sheetId is required" });
    const protectedIds = ["strivers-180", "sql-75", "codeforces-ladder", "os", "dbms", "cn", "sql"];
    if (protectedIds.includes(sheetId)) return res.status(403).json({ success: false, message: "Protected system roadmaps cannot be deleted" });

    const adminUser = await User.findById(req.user.id).select("role").lean();
    if (adminUser?.role === "admin") {
      await GlobalSheet.deleteOne({ id: sheetId });
      await UserCodingProgress.updateMany({}, { $pull: { customSheets: { id: sheetId }, activeSheets: sheetId } });
    } else {
      await UserCodingProgress.updateOne({ userId: req.user.id }, { $pull: { customSheets: { id: sheetId }, activeSheets: sheetId } });
    }
    res.json({ success: true, message: "Roadmap deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete roadmap" });
  }
};


// 16. POST /api/practice/reset-progress
exports.resetProgress = async (req, res) => {
  try {
    await Promise.all([
      UserCodingProgress.findOneAndUpdate({ userId: req.user.id }, { $set: { solvedProblemKeys: [] } }, { new: true, upsert: true }),
      DailyActivity.updateOne({ userId: req.user.id, date: getLocalDateString(new Date()) }, { $set: { codingProblemsSolved: 0 } }),
    ]);
    res.json({ success: true, message: "Coding progress reset successfully.", totalSolved: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reset progress" });
  }
};

// 17. GET /api/practice/problem-note/:problemKey
exports.getProblemNote = async (req, res) => {
  try {
    const { problemKey } = req.params;
    if (!req.user?.id || !problemKey) return res.status(400).json({ success: false, message: "Missing required parameters" });
    const note = await ProblemNote.findOne({ userId: req.user.id, problemKey }).lean();
    return res.json({ success: true, content: note ? note.content : "", updatedAt: note ? note.updatedAt : null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch note" });
  }
};

// 18. POST /api/practice/problem-note/:problemKey
exports.saveProblemNote = async (req, res) => {
  try {
    const { problemKey } = req.params;
    const { content, problemTitle } = req.body;
    if (!req.user?.id || !problemKey) return res.status(400).json({ success: false, message: "Missing required parameters" });
    const updated = await ProblemNote.findOneAndUpdate(
      { userId: req.user.id, problemKey },
      { content: typeof content === "string" ? content : "", problemTitle: problemTitle || "" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, content: updated.content, updatedAt: updated.updatedAt });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save note" });
  }
};

Object.assign(exports, {
  cleanProblemTitle, findProblemInDatabase, isPracticeJudgeUrl, isInstructorResourceUrl,
  parseCodeforcesUrl, resolveProblemItem, parseCsvProblems, extractTitleFromUrl, detectPlatform,
});
