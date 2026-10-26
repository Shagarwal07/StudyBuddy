/**
 * practiceDataService.js
 * In-memory dataset caching, CSV parsing, problem resolution, and sheet compilation.
 * Offloads heavy data management from practiceController.
 */

const path = require("path");
const fs = require("fs");
const axios = require("axios");
const {
  normalize,
  parseCodeforcesUrl,
  extractTitleFromUrl,
  isPracticeJudgeUrl,
  isInstructorResourceUrl,
  cleanProblemTitle,
} = require("../utils/urlParser");
const { sortModulesByPedagogy } = require("../utils/dsaCategorizer");
const ProblemSolution = require("../models/ProblemSolution");
const GlobalSheet = require("../models/GlobalSheet");
const UserCodingProgress = require("../models/UserCodingProgress");
const DailyActivity = require("../models/DailyActivity");
const { getLocalDateString } = require("../utils/dateUtils");
const leetcodeService = require("./leetcodeService");
const billuAiService = require("./billuAiService");

// In-memory fast dataset maps & metadata
let tuf180Data = null;
let sql75Data = null;
const catalogMap = new Map();
const leetcodeSolutionsMap = new Map();
const curatedSolutionsMap = new Map();
const tufItemMap = new Map();
const tufNonLeetcodeMap = new Map();
const codeforcesMap = new Map();
const codeforcesSolutionsMap = new Map();
const externalProblemsMap = new Map();
const aiStandaloneSolutionsMap = new Map();
let lastLcMtime = 0;
let lastAiMtime = 0;
const dataDir = path.resolve(__dirname, "../data");

function loadData() {
  try {
    const lcSolPath = path.join(dataDir, "leetcode/leetcode-solutions.json");
    if (fs.existsSync(lcSolPath)) {
      const stat = fs.statSync(lcSolPath);
      if (lastLcMtime !== stat.mtimeMs || leetcodeSolutionsMap.size < 100) {
        lastLcMtime = stat.mtimeMs;
        const raw = JSON.parse(fs.readFileSync(lcSolPath, "utf8"));
        leetcodeSolutionsMap.clear();
        for (const [key, sol] of Object.entries(raw)) {
          leetcodeSolutionsMap.set(normalize(key), sol);
          if (sol.title) leetcodeSolutionsMap.set(normalize(sol.title), sol);
          if (sol.leetcodeId) leetcodeSolutionsMap.set(String(sol.leetcodeId), sol);
        }
      }
    }

    if (!tuf180Data) {
      const tufPath = path.join(dataDir, "tuf/tuf-sde-180-mapped.json");
      if (fs.existsSync(tufPath)) {
        tuf180Data = JSON.parse(fs.readFileSync(tufPath, "utf8"));
        const items = tuf180Data.modules ? tuf180Data.modules.flatMap((m) => m.items || []) : [];
        items.forEach((it) => {
          tufItemMap.set(normalize(it.title), it);
          if (it.leetcodeSlug) tufItemMap.set(normalize(it.leetcodeSlug), it);
          if (it.id) tufItemMap.set(String(it.id), it);
          if (it.leetcodeId) tufItemMap.set(String(it.leetcodeId), it);
        });
      }
    }

    if (curatedSolutionsMap.size === 0) {
      const curatedPath = path.join(dataDir, "curated-solutions.json");
      if (fs.existsSync(curatedPath)) {
        const raw = JSON.parse(fs.readFileSync(curatedPath, "utf8"));
        for (const [key, sol] of Object.entries(raw)) {
          curatedSolutionsMap.set(normalize(key), sol);
          if (sol.title) curatedSolutionsMap.set(normalize(sol.title), sol);
        }
      }
    }

    if (!sql75Data) {
      const sqlPath = path.join(dataDir, "tuf/tuf-sql-75.json");
      if (fs.existsSync(sqlPath)) {
        sql75Data = JSON.parse(fs.readFileSync(sqlPath, "utf8"));
      }
    }

    if (tufNonLeetcodeMap.size === 0) {
      const nonLcPath = path.join(dataDir, "tuf/tuf-non-leetcode-problems.json");
      if (fs.existsSync(nonLcPath)) {
        const raw = JSON.parse(fs.readFileSync(nonLcPath, "utf8"));
        for (const [key, prob] of Object.entries(raw)) {
          tufNonLeetcodeMap.set(normalize(key), prob);
          if (prob.title) tufNonLeetcodeMap.set(normalize(prob.title), prob);
          if (prob.id) tufNonLeetcodeMap.set(String(prob.id), prob);
          if (prob.slug) tufNonLeetcodeMap.set(normalize(prob.slug), prob);
        }
      }
    }

    if (catalogMap.size === 0) {
      const lcPath = path.join(dataDir, "leetcode/leetcode-catalog.json");
      if (fs.existsSync(lcPath)) {
        const catalog = JSON.parse(fs.readFileSync(lcPath, "utf8"));
        catalog.forEach((item) => {
          catalogMap.set(normalize(item.title), item);
          if (item.slug) catalogMap.set(normalize(item.slug), item);
          if (item.id) catalogMap.set(String(item.id), item);
          if (item.questionId) catalogMap.set(String(item.questionId), item);
        });
      }
    }

    if (codeforcesMap.size === 0) {
      const cfPath = path.join(dataDir, "codeforces/codeforces-catalog.json");
      if (fs.existsSync(cfPath)) {
        const cfCatalog = JSON.parse(fs.readFileSync(cfPath, "utf8"));
        cfCatalog.forEach((item) => {
          codeforcesMap.set(normalize(item.title || item.name), item);
          if (item.id) codeforcesMap.set(normalize(item.id), item);
        });
      }
    }

    if (codeforcesSolutionsMap.size === 0) {
      const cfSolPath = path.join(dataDir, "codeforces/codeforces-solutions.json");
      if (fs.existsSync(cfSolPath)) {
        const raw = JSON.parse(fs.readFileSync(cfSolPath, "utf8"));
        for (const [key, sol] of Object.entries(raw)) {
          codeforcesSolutionsMap.set(normalize(key), sol);
          if (sol.title) codeforcesSolutionsMap.set(normalize(sol.title), sol);
          if (sol.id) codeforcesSolutionsMap.set(normalize(sol.id), sol);
        }
      }
    }

    if (externalProblemsMap.size === 0) {
      const extPath = path.join(dataDir, "external/external-problems.json");
      if (fs.existsSync(extPath)) {
        const extCatalog = JSON.parse(fs.readFileSync(extPath, "utf8"));
        extCatalog.forEach((item) => {
          externalProblemsMap.set(normalize(item.title), item);
          if (item.id) externalProblemsMap.set(normalize(item.id), item);
          if (Array.isArray(item.aliases)) {
            item.aliases.forEach((alias) => externalProblemsMap.set(normalize(alias), item));
          }
        });
      }
    }

    const aiSolPath = path.join(dataDir, "ai-standalone-solutions.json");
    if (fs.existsSync(aiSolPath)) {
      const stat = fs.statSync(aiSolPath);
      if (lastAiMtime !== stat.mtimeMs || aiStandaloneSolutionsMap.size === 0) {
        lastAiMtime = stat.mtimeMs;
        try {
          const raw = JSON.parse(fs.readFileSync(aiSolPath, "utf8"));
          aiStandaloneSolutionsMap.clear();
          for (const [key, val] of Object.entries(raw)) {
            aiStandaloneSolutionsMap.set(normalize(key), val);
          }
        } catch (e) {
          console.error("[PracticeDataService] Failed to parse ai-standalone-solutions.json:", e.message);
        }
      }
    }
  } catch (err) {
    console.error("[PracticeDataService] Error loading static datasets:", err.message);
  }
}

// Initial warm-up
loadData();

function findProblemInDatabase(cleanTitle, rawTitle = "") {
  loadData();
  const normClean = normalize(cleanTitle);
  const normRaw = normalize(rawTitle);

  let match =
    catalogMap.get(normClean) ||
    tufItemMap.get(normClean) ||
    curatedSolutionsMap.get(normClean) ||
    leetcodeSolutionsMap.get(normClean) ||
    codeforcesMap.get(normClean) ||
    externalProblemsMap.get(normClean);
  if (match) return match;

  if (normRaw && normRaw !== normClean) {
    match =
      catalogMap.get(normRaw) ||
      tufItemMap.get(normRaw) ||
      curatedSolutionsMap.get(normRaw) ||
      leetcodeSolutionsMap.get(normRaw) ||
      codeforcesMap.get(normRaw) ||
      externalProblemsMap.get(normRaw);
    if (match) return match;
  }

  const cleanWords = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "with", "from"].includes(w));

  if (cleanWords.length >= 2) {
    for (const [key, item] of externalProblemsMap.entries()) {
      if (key !== normalize(item.title)) continue;
      const titleLower = (item.title || "").toLowerCase();
      if (cleanWords.every((w) => titleLower.includes(w))) return item;
    }
    for (const [key, item] of catalogMap.entries()) {
      if (key !== normalize(item.title)) continue;
      const titleLower = (item.title || "").toLowerCase();
      if (cleanWords.every((w) => titleLower.includes(w))) return item;
    }
    for (const [key, item] of codeforcesMap.entries()) {
      if (key !== normalize(item.title || item.name)) continue;
      const titleLower = (item.title || item.name || "").toLowerCase();
      if (cleanWords.every((w) => titleLower.includes(w))) return item;
    }
  }

  return null;
}

const hasProblemSolution = (normTitle, normSlug, id) =>
  leetcodeSolutionsMap.has(normTitle) ||
  (normSlug && leetcodeSolutionsMap.has(normSlug)) ||
  (id && leetcodeSolutionsMap.has(String(id))) ||
  curatedSolutionsMap.has(normTitle) ||
  tufNonLeetcodeMap.has(normTitle) ||
  (id && tufNonLeetcodeMap.has(String(id))) ||
  codeforcesSolutionsMap.has(normTitle) ||
  (id && codeforcesSolutionsMap.has(normalize(id)));

function resolveProblemItem(p, idx = 0) {
  const rawTitle = (p.title || `Problem ${idx + 1}`).trim();
  const cleanTitle = cleanProblemTitle(rawTitle);
  const normTitle = normalize(cleanTitle);

  const rawUrls = [p.solutionUrl, p.instructorUrl, p.platformUrl, p.questionUrl, p.url]
    .filter((u) => u && typeof u === "string" && u.trim().startsWith("http"))
    .map((u) => u.trim());
  const uniqueUrls = [...new Set(rawUrls)];

  loadData();
  let dbItem = null;
  for (const u of uniqueUrls) {
    if (u.includes("codeforces.com")) {
      const cfParsed = parseCodeforcesUrl(u);
      if (cfParsed?.normId) {
        dbItem = codeforcesMap.get(cfParsed.normId);
        if (dbItem) break;
      }
    }
    if (u.includes("/problems/")) {
      const s = u.split("/problems/")[1]?.split("/")[0] || "";
      if (s) {
        dbItem = catalogMap.get(normalize(s)) || tufItemMap.get(normalize(s));
        if (dbItem) break;
      }
    }
  }

  if (!dbItem) {
    dbItem = findProblemInDatabase(cleanTitle, rawTitle);
  }

  let finalTitle = cleanTitle;
  let finalPlatform = p.platform || "";
  let platformUrl = p.questionUrl || p.platformUrl || p.url || "";
  let solutionUrl = p.solutionUrl || p.instructorUrl || "";
  let leetcodeSlug = p.leetcodeSlug || "";
  let leetcodeId = p.leetcodeId || "";
  let leetcodeDifficulty = p.difficulty || "Medium";
  let leetcodeUrl = p.leetcodeUrl || "";

  if (dbItem) {
    finalTitle = dbItem.title || dbItem.name || finalTitle;
    finalPlatform = dbItem.platform || (dbItem.contestId ? "Codeforces" : "LeetCode");
    leetcodeSlug = dbItem.slug || dbItem.leetcodeSlug || leetcodeSlug;
    leetcodeId = dbItem.id || dbItem.leetcodeId || leetcodeId;
    leetcodeDifficulty = dbItem.difficulty || leetcodeDifficulty;
    leetcodeUrl = dbItem.url || dbItem.leetcodeUrl || (leetcodeSlug ? `https://leetcode.com/problems/${leetcodeSlug}/` : "");

    if (!platformUrl) {
      platformUrl = leetcodeUrl || dbItem.platformUrl || "";
    }
    if (!solutionUrl) {
      solutionUrl = dbItem.tufHref || dbItem.solutionUrl || "";
    }
  }

  return {
    ...p,
    title: finalTitle,
    platform: finalPlatform || "LeetCode",
    platformUrl: platformUrl || leetcodeUrl || (leetcodeSlug ? `https://leetcode.com/problems/${leetcodeSlug}/` : ""),
    questionUrl: platformUrl,
    solutionUrl,
    instructorUrl: solutionUrl,
    leetcodeId: String(leetcodeId || ""),
    leetcodeSlug,
    leetcodeDifficulty,
    leetcodeUrl,
    hasNotes: Boolean(p.hasNotes || (dbItem && hasProblemSolution(normTitle, leetcodeSlug, leetcodeId))),
    key: normTitle,
  };
}

function parseTestCasesFromExamples(examplesText) {
  if (!examplesText) return [];
  const cases = [];
  const regex = /(?:Example\s*(\d+)?:?[\s\S]*?)?Input:\s*([^\n]+)[\s\S]*?Ou?tput:\s*([^\n]+)/gi;
  let match;
  let id = 1;
  while ((match = regex.exec(examplesText)) !== null) {
    const input = match[2].trim().replace(/^`|`$/g, "").replace(/Explanation.*$/i, "").trim();
    const output = match[3].trim().replace(/^`|`$/g, "").replace(/Explanation.*$/i, "").replace(/[.,;:]+$/, "").trim();
    if (input && output) {
      cases.push({ id: id++, input, expectedOutput: output });
    }
  }
  return cases;
}

function parseCsvProblems(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const rows = lines.map(parseLine);
  if (rows.length === 0) return [];

  const firstRow = rows[0];
  const isHeader = firstRow.some((c) =>
    /problem|title|question|leetcode|link|url|difficulty|topic|module|tag/i.test(c)
  );
  const dataRows = isHeader ? rows.slice(1) : rows;

  return dataRows
    .map((cols, idx) => {
      const urls = [];
      let titleCol = "";
      let diffCol = null;
      let topicCol = null;

      cols.forEach((c) => {
        const matchUrls = c.match(/https?:\/\/[^\s,;"']+/gi);
        if (matchUrls) {
          urls.push(...matchUrls);
        } else if (!titleCol && c.length > 1 && !/^(easy|medium|hard|\d+)$/i.test(c)) {
          titleCol = c;
        } else if (/^(easy|medium|hard)$/i.test(c)) {
          diffCol = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
        } else if (c.length > 2 && !topicCol && !/^\d+$/.test(c)) {
          topicCol = c;
        }
      });

      let questionUrl = "";
      let solutionUrl = "";
      if (urls.length >= 2) {
        if (isPracticeJudgeUrl(urls[0])) {
          questionUrl = urls[0];
          solutionUrl = urls[1];
        } else if (isInstructorResourceUrl(urls[0])) {
          solutionUrl = urls[0];
          questionUrl = urls[1];
        } else {
          questionUrl = urls[0];
          solutionUrl = urls[1];
        }
      } else if (urls.length === 1) {
        if (isInstructorResourceUrl(urls[0])) {
          solutionUrl = urls[0];
        } else {
          questionUrl = urls[0];
        }
      }

      const cleanTitle = titleCol ? cleanProblemTitle(titleCol) : extractTitleFromUrl(questionUrl) || `Problem ${idx + 1}`;

      return {
        title: cleanTitle,
        difficulty: diffCol || "Medium",
        module: topicCol || "General Practice",
        questionUrl,
        solutionUrl,
      };
    })
    .filter((p) => Boolean(p.title));
}

function getFallbackSheet(sheetId) {
  loadData();
  if (sheetId === "strivers-180" && tuf180Data?.modules) {
    const problems = [];
    tuf180Data.modules.forEach((m) =>
      (m.items || []).forEach((it) => {
        problems.push({
          ...it,
          module: m.moduleTitle,
          platform: Boolean(it.leetcodeSlug || it.leetcodeUrl) ? "LeetCode" : "takeUforward",
          platformUrl: it.leetcodeUrl || it.tufHref || `https://leetcode.com/problem-list/all/?search=${encodeURIComponent(it.title)}`,
        });
      })
    );
    return {
      id: "strivers-180",
      title: "SDE 180 Master Sheet",
      description: "33 modules covering all core interview DSA patterns mapped directly to LeetCode.",
      category: "DSA Patterns",
      isOfficial: true,
      badge: "Developer / Admin",
      problems,
    };
  }
  if (sheetId === "sql-75" && sql75Data?.modules) {
    const problems = [];
    sql75Data.modules.forEach((m) =>
      (m.items || []).forEach((it) => {
        problems.push({
          ...it,
          module: m.moduleTitle,
          platform: "SQL Hub",
          platformUrl: it.tufHref || `https://takeuforward.org/practice/sql/${it.id}`,
        });
      })
    );
    return {
      id: "sql-75",
      title: "SQL 75 Practical",
      description: "12 modules covering joins, aggregations, window functions, and advanced querying.",
      category: "Database & SQL",
      isOfficial: true,
      badge: "Developer / Admin",
      problems,
    };
  }
  const fileMap = {
    "codeforces-ladder": "codeforces/codeforces-ladder.json",
    "neetcode-150": "neetcode/neetcode-150.json",
    "strivers-a2z": "tuf/tuf-strivers-a2z.json",
  };
  const relPath = fileMap[sheetId];
  if (relPath) {
    const filePath = path.join(dataDir, relPath);
    if (fs.existsSync(filePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const problems = raw.problems || [];
        if (!problems.length && raw.modules) {
          raw.modules.forEach((m) => (m.items || []).forEach((it) => problems.push({ ...it, module: m.moduleTitle })));
        }
        return {
          id: sheetId,
          title: raw.sheetName || raw.title || sheetId,
          description: raw.description || "",
          category: raw.category || "DSA Patterns",
          isOfficial: true,
          badge: sheetId === "neetcode-150" ? "Top Pick" : sheetId === "strivers-a2z" ? "Mastery" : "Contests",
          sourceUrl: raw.sourceUrl || "",
          problems,
        };
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}

function formatSheetResponse(sheet, solvedSet, starredSet) {
  loadData();
  const items = (sheet.problems || []).map((p, idx) => {
    const item = resolveProblemItem(p, idx);
    const normTitle = item.key;
    const normSlug = item.leetcodeSlug ? normalize(item.leetcodeSlug) : "";
    return {
      ...item,
      isSolved:
        solvedSet.has(normTitle) ||
        solvedSet.has(String(p.id)) ||
        solvedSet.has(normalize(p.id)) ||
        solvedSet.has("cf" + normalize(p.id)) ||
        solvedSet.has(String(item.leetcodeId)) ||
        (normSlug && solvedSet.has(normSlug)),
      isStarred:
        starredSet.has(normTitle) ||
        starredSet.has(String(p.id)) ||
        starredSet.has(String(item.leetcodeId)),
      hasSolution: item.hasNotes || hasProblemSolution(normTitle, item.leetcodeSlug, item.leetcodeId),
    };
  });

  const moduleMap = new Map();
  items.forEach((item) => {
    const modName = item.module || "Core Problems";
    if (!moduleMap.has(modName)) moduleMap.set(modName, []);
    moduleMap.get(modName).push(item);
  });

  const rawModules = Array.from(moduleMap.entries()).map(([moduleTitle, modItems], mIdx) => ({
    moduleId: `mod-${mIdx + 1}`,
    moduleTitle,
    items: modItems,
  }));

  const preserveOrder = Boolean(sheet.isOfficial || sheet.id?.startsWith("neetcode") || sheet.id?.startsWith("striver"));
  const modules = preserveOrder ? rawModules : sortModulesByPedagogy(rawModules);

  return {
    success: true,
    sheetTitle: sheet.title,
    totalItems: items.length,
    modules: modules.length > 0 ? modules : [{ moduleId: "mod-1", moduleTitle: sheet.category || "Problems", items }],
    uploadedBy: sheet.uploadedBy?.name || sheet.uploadedBy || (sheet.isOfficial ? "Developer / Admin" : "You (Personal)"),
    isOfficial: Boolean(sheet.isOfficial),
    badge: sheet.badge || (sheet.isOfficial ? "Developer / Admin" : "Custom"),
    sourceUrl: sheet.sourceUrl || "",
    lastSyncedAt: sheet.lastSyncedAt || null,
  };
}

function findLcSolFuzzy(normKey) {
  for (const [key, sol] of leetcodeSolutionsMap.entries()) {
    if (key.includes(normKey) || normKey.includes(key)) return sol;
  }
  return null;
}

function mergeAiLanguages(approaches, problemKey, resolvedSlug, aiDocs = []) {
  if (!Array.isArray(approaches) || approaches.length === 0) return approaches;
  loadData();
  const aiData =
    (resolvedSlug ? aiStandaloneSolutionsMap.get(normalize(resolvedSlug)) : null) ||
    aiStandaloneSolutionsMap.get(normalize(problemKey));

  approaches.forEach((app) => {
    if (!app.isOfficial && !app.name?.includes("★") && !app.name?.toLowerCase().includes("official")) {
      if (!app.codes || typeof app.codes !== "object") {
        app.codes = {};
      }

      if (Array.isArray(aiDocs) && aiDocs.length > 0) {
        aiDocs.forEach((doc) => {
          if (doc.approachName === app.name && doc.code && typeof doc.code === "string" && doc.code.trim()) {
            app.codes[doc.lang] = doc.code;
          }
        });
      }

      if (aiData && aiData[app.name]) {
        const standaloneCodes = aiData[app.name];
        Object.entries(standaloneCodes).forEach(([l, c]) => {
          if (!app.codes[l] && typeof c === "string" && c.trim()) {
            app.codes[l] = c;
          }
        });
      }
    }
  });

  return approaches;
}

async function fetchContentFromUrl(url) {
  let targetUrl = url?.trim();
  const driveMatch = targetUrl.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/i);
  if (driveMatch) {
    targetUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  } else if (targetUrl.includes("docs.google.com/spreadsheets")) {
    targetUrl = targetUrl.replace(/\/edit.*$/, "/export?format=csv");
  }

  const response = await axios.get(targetUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: { "User-Agent": "StudyBuddy-Importer/1.0" },
  });

  const contentType = (response.headers["content-type"] || "").toLowerCase();
  const isBinary =
    contentType.includes("pdf") ||
    contentType.includes("officedocument") ||
    contentType.includes("excel") ||
    contentType.includes("octet-stream");

  if (!isBinary) {
    const rawText = Buffer.from(response.data).toString("utf8");
    return { type: "text", rawText };
  }

  const fileBase64 = Buffer.from(response.data).toString("base64");
  return {
    type: "binary",
    fileBase64,
    mimeType: contentType.split(";")[0] || "application/pdf",
    fileName: targetUrl.split("/").pop()?.split("?")[0] || "document.pdf",
  };
}

function formatComplexity(val) {
  if (!val) return "O(N)";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val.worst || val.average || val.best || val.total || val.auxiliary || val.note || "O(N)";
  }
  return String(val);
}

function loadTUF() {
  loadData();
  return tuf180Data;
}

function parseCSV(csvText) {
  return parseCsvProblems(csvText);
}

function getProblems(sheetId) {
  loadData();
  const sheet = getFallbackSheet(sheetId);
  return sheet ? sheet.problems || [] : [];
}

async function getProblemSolutionData({ problemKey, querySlug, queryId, queryTufHref, queryPlatform }) {
  const cleanKey = cleanProblemTitle(problemKey);
  const normKey = normalize(problemKey);
  const normClean = normalize(cleanKey);

  let resolvedSlug = querySlug ? String(querySlug).toLowerCase().trim() : "";
  if (!resolvedSlug && problemKey.includes("-")) {
    resolvedSlug = problemKey.toLowerCase().trim();
  }

  loadData();

  const matchedDbItem = findProblemInDatabase(cleanKey, problemKey);

  const catItem =
    (resolvedSlug ? catalogMap.get(normalize(resolvedSlug)) : null) ||
    catalogMap.get(normClean) ||
    catalogMap.get(normKey) ||
    (matchedDbItem ? catalogMap.get(normalize(matchedDbItem.title)) : null) ||
    (queryId ? catalogMap.get(String(queryId)) : null);

  if (!resolvedSlug && catItem?.slug) resolvedSlug = catItem.slug;
  if (!resolvedSlug && matchedDbItem?.slug) resolvedSlug = matchedDbItem.slug;
  if (!resolvedSlug && matchedDbItem?.leetcodeSlug) resolvedSlug = matchedDbItem.leetcodeSlug;

  let lcSol =
    (resolvedSlug && leetcodeSolutionsMap.get(normalize(resolvedSlug))) ||
    leetcodeSolutionsMap.get(normClean) ||
    leetcodeSolutionsMap.get(normKey) ||
    (catItem && leetcodeSolutionsMap.get(normalize(catItem.title))) ||
    (matchedDbItem && leetcodeSolutionsMap.get(normalize(matchedDbItem.title))) ||
    (catItem?.questionId && leetcodeSolutionsMap.get(String(catItem.questionId))) ||
    (matchedDbItem?.leetcodeId && leetcodeSolutionsMap.get(String(matchedDbItem.leetcodeId))) ||
    (queryId && leetcodeSolutionsMap.get(String(queryId))) ||
    findLcSolFuzzy(normClean) ||
    findLcSolFuzzy(normKey);

  if (!resolvedSlug && lcSol?.url?.includes("/problems/")) {
    resolvedSlug = lcSol.url.split("/problems/")[1]?.split("/")[0];
  }

  const curatedSol =
    curatedSolutionsMap.get(normClean) ||
    curatedSolutionsMap.get(normKey) ||
    (resolvedSlug ? curatedSolutionsMap.get(normalize(resolvedSlug)) : null) ||
    (catItem ? curatedSolutionsMap.get(normalize(catItem.title)) : null) ||
    (matchedDbItem ? curatedSolutionsMap.get(normalize(matchedDbItem.title)) : null);

  const orFilters = [{ aliases: normClean }, { aliases: normKey }];
  if (resolvedSlug) {
    orFilters.push({ slug: resolvedSlug }, { aliases: resolvedSlug });
  }
  if (queryId) {
    orFilters.push({ aliases: normalize(queryId) }, { aliases: String(queryId).toLowerCase().trim() });
  }

  const targetSlugAliases = Array.from(new Set([resolvedSlug, normalize(resolvedSlug), cleanKey, normClean, normKey].filter(Boolean)));
  const aiDocs = await ProblemSolution.find({
    $or: [{ slug: { $in: targetSlugAliases } }, { aliases: { $in: targetSlugAliases } }, { key: { $in: targetSlugAliases } }],
    isAiGenerated: true,
  }).lean().catch(() => []);

  const dbSol = await ProblemSolution.findOne({ $or: orFilters, isAiGenerated: false }).lean().catch(() => null);
  const useCuratedMulti = curatedSol?.approaches?.length > 1 && (!dbSol?.approaches || dbSol.approaches.length <= 1);

  if (dbSol && (dbSol.approaches?.length || dbSol.defaultCode) && !useCuratedMulti) {
    let rawApproaches = dbSol.approaches || [];
    if (
      rawApproaches.length === 1 &&
      (rawApproaches[0].code?.includes("class Solution") ||
        rawApproaches[0].codes?.java?.includes("class Solution"))
    ) {
      rawApproaches[0].name = "★ Official";
      rawApproaches[0].isOfficial = true;
      rawApproaches[0].isLeetCode = true;
    }

    const approaches = rawApproaches.map((app) => {
      let appCodes = typeof app.codes === "object" && app.codes !== null
        ? { ...app.codes }
        : typeof app.code === "object" && app.code !== null
          ? { ...app.code }
          : { java: typeof app.code === "string" ? app.code : "" };

      Object.keys(appCodes).forEach((k) => {
        if (!appCodes[k] || typeof appCodes[k] !== "string" || !appCodes[k].trim()) {
          delete appCodes[k];
        }
      });

      let appCode = typeof app.code === "string" && app.code.trim()
        ? app.code
        : appCodes.java || appCodes.cpp || appCodes.python || "";

      return {
        ...app,
        timeComplexity: formatComplexity(app.timeComplexity),
        spaceComplexity: formatComplexity(app.spaceComplexity || "O(1)"),
        code: appCode,
        codes: appCodes,
      };
    });

    const officialApp = approaches.find(
      (a) => a.isOfficial || a.name?.includes("★") || a.name?.toLowerCase().includes("official")
    );
    if (officialApp && lcSol?.code && typeof lcSol.code === "object") {
      if (!officialApp.codes || typeof officialApp.codes !== "object") officialApp.codes = {};
      Object.keys(lcSol.code).forEach((langKey) => {
        if (lcSol.code[langKey] && (!officialApp.codes[langKey] || !officialApp.codes[langKey].trim())) {
          officialApp.codes[langKey] = lcSol.code[langKey];
        }
      });
    } else if (!officialApp && lcSol?.code) {
      const lcCodes = typeof lcSol.code === "object" ? { ...lcSol.code } : { java: lcSol.code || "" };
      const lcRaw = lcCodes.java || lcCodes.cpp || lcCodes.python || lcCodes.javascript || "";
      if (lcRaw) {
        const optimalApp = approaches.find((a) => a.name?.toLowerCase().includes("optimal")) || approaches[approaches.length - 1];
        approaches.push({
          name: "★ Official",
          isOfficial: true,
          isLeetCode: true,
          timeComplexity: formatComplexity(lcSol.timeComplexity || optimalApp?.timeComplexity),
          spaceComplexity: formatComplexity(lcSol.spaceComplexity || optimalApp?.spaceComplexity || "O(1)"),
          intuition: lcSol.explanation || "Official platform accepted solution matching the LeetCode judge method signature.",
          code: lcRaw,
          codes: lcCodes,
          url: lcSol.url || (resolvedSlug ? `https://leetcode.com/problems/${resolvedSlug}/` : undefined),
        });
      }
    }

    mergeAiLanguages(approaches, cleanKey || problemKey, resolvedSlug, aiDocs);

    const defaultCode =
      approaches.find((a) => a.name?.toLowerCase().includes("optimal") && !a.isOfficial)?.code ||
      approaches[0]?.code ||
      dbSol.defaultCode ||
      "";

    return {
      success: true,
      hasNotes: true,
      title: dbSol.title || cleanKey || problemKey,
      platform: dbSol.platform || "LeetCode",
      platformUrl: dbSol.platformUrl || (resolvedSlug ? `https://leetcode.com/problems/${resolvedSlug}/` : ""),
      problemStatement: dbSol.problemStatement || `Solve the problem: "${dbSol.title}".`,
      constraints: dbSol.constraints || [],
      examples: dbSol.examples || "",
      testCases: dbSol.testCases || [],
      approaches,
      leetcodeSolution: lcSol,
      defaultCode,
    };
  }

  const tufItem =
    tufItemMap.get(normClean) ||
    tufItemMap.get(normKey) ||
    (resolvedSlug ? tufItemMap.get(normalize(resolvedSlug)) : null) ||
    (queryId ? tufItemMap.get(String(queryId)) : null);

  const nonLcProb =
    tufNonLeetcodeMap.get(normClean) ||
    tufNonLeetcodeMap.get(normKey) ||
    (resolvedSlug ? tufNonLeetcodeMap.get(normalize(resolvedSlug)) : null) ||
    (queryId ? tufNonLeetcodeMap.get(String(queryId)) : null) ||
    (queryId ? codeforcesMap.get(normalize(queryId)) : null) ||
    tufItem ||
    externalProblemsMap.get(normClean) ||
    externalProblemsMap.get(normKey) ||
    codeforcesMap.get(normClean) ||
    codeforcesMap.get(normKey) ||
    (matchedDbItem?.platform && matchedDbItem.platform !== "LeetCode" ? matchedDbItem : null);

  let details = null;
  if (resolvedSlug) {
    try {
      details = await leetcodeService.getProblemDetails(resolvedSlug);
    } catch {
      details = null;
    }
  }

  const testCases = details?.testCases?.length
    ? details.testCases
    : (nonLcProb?.testCases?.length
      ? nonLcProb.testCases
      : parseTestCasesFromExamples(curatedSol?.examples || lcSol?.examples || ""));

  const problemStatement =
    details?.description ||
    nonLcProb?.description ||
    curatedSol?.problemStatement ||
    lcSol?.description ||
    `Solve the problem: "${details?.title || nonLcProb?.title || curatedSol?.title || lcSol?.title || catItem?.title || problemKey}".`;

  const constraints = details?.constraints || nonLcProb?.constraints || [];
  const examplesText = testCases
    .map((tc, i) => `Example ${i + 1}:\nInput: ${tc.input}\nOutput: ${tc.expectedOutput}${tc.explanation ? `\nExplanation: ${tc.explanation}` : ""}`)
    .join("\n\n");

  const cfSol =
    codeforcesSolutionsMap.get(normKey) ||
    (queryId ? codeforcesSolutionsMap.get(normalize(queryId)) : null) ||
    (catItem ? codeforcesSolutionsMap.get(normalize(catItem.title)) : null);

  if (cfSol) {
    const approaches = cfSol.approaches || [];
    const defaultCode = approaches[0]?.codes?.cpp || approaches[0]?.code || "";
    return {
      success: true,
      hasNotes: true,
      title: cfSol.title || problemKey,
      platform: "Codeforces",
      platformUrl: cfSol.url,
      problemStatement: cfSol.problemStatement || `Codeforces ${cfSol.id}: "${cfSol.title}". Rating: ${cfSol.rating || "Unrated"}. Solve using standard competitive programming I/O.`,
      constraints: cfSol.constraints || (cfSol.rating ? [`Rating: ${cfSol.rating}`, `Difficulty: ${cfSol.difficulty}`] : []),
      examples: cfSol.examples || "",
      testCases: cfSol.testCases || [],
      approaches,
      leetcodeSolution: null,
      defaultCode,
    };
  }

  if (curatedSol || lcSol || details) {
    const codes = typeof lcSol?.code === "object" ? { ...lcSol.code } : { java: lcSol?.code || "" };
    const lcRawCode = codes.java || codes.cpp || codes.python || codes.javascript || "";

    const approaches = [];
    if (curatedSol?.approaches?.length) {
      approaches.push(...curatedSol.approaches.filter(
        (app) => !["takeuforward", "tuf"].includes(app.name?.trim().toLowerCase())
      ));
    }

    if (approaches.length === 0) {
      if (lcRawCode) {
        approaches.push({
          name: "★ Official",
          isOfficial: true,
          isLeetCode: true,
          isTuf: false,
          timeComplexity: formatComplexity(lcSol?.timeComplexity),
          spaceComplexity: formatComplexity(lcSol?.spaceComplexity || "O(1)"),
          intuition: lcSol?.explanation || "Official platform accepted solution matching the LeetCode judge method signature.",
          code: lcRawCode,
          codes: codes,
          url: lcSol?.url || (resolvedSlug ? `https://leetcode.com/problems/${resolvedSlug}/` : undefined),
        });
      }
    } else {
      approaches.forEach((app) => {
        app.timeComplexity = formatComplexity(app.timeComplexity);
        app.spaceComplexity = formatComplexity(app.spaceComplexity || "O(1)");

        let appCodes = typeof app.codes === "object" && app.codes !== null
          ? { ...app.codes }
          : typeof app.code === "object" && app.code !== null
            ? { ...app.code }
            : { java: typeof app.code === "string" ? app.code : "" };

        Object.keys(appCodes).forEach((k) => {
          if (!appCodes[k] || typeof appCodes[k] !== "string" || !appCodes[k].trim()) {
            delete appCodes[k];
          }
        });

        let appCode = (typeof app.code === "string" && app.code.trim())
          ? app.code
          : appCodes.java || "";

        app.codes = appCodes;
        app.code = appCode;
        if (lcSol?.url && !app.url) app.url = lcSol.url;
      });

      if (lcRawCode) {
        const optimalApp = approaches.find((a) => a.name?.toLowerCase().includes("optimal")) || approaches[approaches.length - 1];
        approaches.push({
          name: "★ Official",
          isOfficial: true,
          isLeetCode: true,
          timeComplexity: formatComplexity(lcSol?.timeComplexity || optimalApp?.timeComplexity),
          spaceComplexity: formatComplexity(lcSol?.spaceComplexity || optimalApp?.spaceComplexity || "O(1)"),
          intuition: lcSol?.explanation || "Official platform accepted solution matching the LeetCode judge method signature.",
          code: lcRawCode,
          codes: codes,
          url: lcSol?.url || (resolvedSlug ? `https://leetcode.com/problems/${resolvedSlug}/` : undefined),
        });
      }
    }

    mergeAiLanguages(approaches, cleanKey || problemKey, resolvedSlug, aiDocs);

    const optimalApp = approaches.find((a) => a.name?.toLowerCase().includes("optimal") && !a.isOfficial);
    const defaultCode =
      optimalApp?.codes?.java ||
      optimalApp?.codes?.cpp ||
      optimalApp?.code ||
      approaches[0]?.codes?.java ||
      approaches[0]?.codes?.cpp ||
      approaches[0]?.code ||
      lcRawCode;

    return {
      success: true,
      hasNotes: true,
      title: details?.title || curatedSol?.title || lcSol?.title || catItem?.title || problemKey,
      platform: "LeetCode",
      platformUrl: lcSol?.url || (resolvedSlug ? `https://leetcode.com/problems/${resolvedSlug}/` : ""),
      problemStatement,
      constraints,
      examples: examplesText,
      testCases,
      approaches,
      leetcodeSolution: lcSol,
      defaultCode,
    };
  }

  if (nonLcProb) {
    const probTitle = nonLcProb.title || nonLcProb.name || problemKey;
    const probUrl = nonLcProb.url || nonLcProb.tufHref || "";
    const isCodeforces = Boolean(
      nonLcProb.platform === "Codeforces" ||
      probUrl.includes("codeforces.com") ||
      codeforcesMap.has(normKey)
    );
    const platformName = isCodeforces
      ? "Codeforces"
      : (nonLcProb.platform || (probUrl.includes("geeksforgeeks.org") ? "GeeksforGeeks" : "takeUforward"));

    const approaches = curatedSol?.approaches?.length
      ? curatedSol.approaches.filter(
        (app) => !["takeuforward", "tuf"].includes(app.name?.trim().toLowerCase())
      )
      : [];

    mergeAiLanguages(approaches, cleanKey || problemKey, resolvedSlug, aiDocs);

    return {
      success: true,
      hasNotes: approaches.length > 0,
      title: probTitle,
      platform: platformName,
      platformUrl: probUrl,
      problemStatement: nonLcProb.description || `Solve the problem: "${probTitle}". Practice and solve using standard input/output.`,
      constraints,
      examples: examplesText,
      testCases,
      approaches,
      leetcodeSolution: null,
      defaultCode: "",
    };
  }

  const fallbackTitle = cleanKey || problemKey;
  return {
    success: true,
    hasNotes: false,
    title: fallbackTitle,
    problemStatement: `Solve the problem: "${fallbackTitle}".`,
    examples: "",
    testCases: [],
    approaches: [],
    leetcodeSolution: null,
    defaultCode: "",
  };
}

function calculateSolvedProblems(problems = [], solvedSet = new Set()) {
  return problems.filter((p) => {
    const cleanTitle = cleanProblemTitle(p.title);
    const normClean = normalize(cleanTitle);
    const normRaw = normalize(p.title);
    const normSlug = p.leetcodeSlug ? normalize(p.leetcodeSlug) : "";
    return (
      solvedSet.has(normClean) ||
      solvedSet.has(normRaw) ||
      solvedSet.has(String(p.id)) ||
      solvedSet.has(normalize(p.id)) ||
      solvedSet.has("cf" + normalize(p.id)) ||
      (p.leetcodeId && solvedSet.has(String(p.leetcodeId))) ||
      (normSlug && solvedSet.has(normSlug))
    );
  }).length;
}

async function extractProblemsFromInput({ sheetUrl, fileBase64, mimeType, fileName, geminiApiKey, rawProblems }) {
  let extractedProblems = [];
  let sheetSource = "Custom Sheet";

  if (sheetUrl?.trim()) {
    const fetched = await fetchContentFromUrl(sheetUrl.trim());
    sheetSource = fetched.type === "binary" ? "Document Link" : (fetched.source || "Cloud Sheet");
    if (fetched.type === "text") {
      try {
        extractedProblems = await billuAiService.scanSheetWithGemini({ rawText: fetched.rawText, apiKey: geminiApiKey });
      } catch {}
      if (!extractedProblems?.length) extractedProblems = parseCsvProblems(fetched.rawText);
    } else {
      extractedProblems = await billuAiService.scanSheetWithGemini({
        fileBase64: fetched.fileBase64,
        mimeType: fetched.mimeType,
        fileName: fetched.fileName,
        apiKey: geminiApiKey,
      });
    }
  } else if (fileBase64) {
    sheetSource = "Document Upload";
    extractedProblems = await billuAiService.scanSheetWithGemini({ fileBase64, mimeType, fileName, apiKey: geminiApiKey });
  } else if (typeof rawProblems === "string" && rawProblems.trim()) {
    sheetSource = "Pasted Problems";
    try {
      extractedProblems = await billuAiService.scanSheetWithGemini({ rawText: rawProblems, apiKey: geminiApiKey });
    } catch {}
    if (!extractedProblems?.length) extractedProblems = parseCsvProblems(rawProblems);
  }

  const enrichedProblems = (extractedProblems || []).map((p, idx) => resolveProblemItem(p, idx));
  return { enrichedProblems, sheetSource };
}

async function generateAiSolutionData({
  problemKey,
  slug,
  title,
  targetApproach,
  cleanLang,
  isOfficialHarness,
  baseCode,
  timeComplexity,
  spaceComplexity,
  explanation,
  customApiKey,
}) {
  const promptVer = billuAiService.PROMPT_VERSION || "v2_standalone";
  const targetSlug = normalize(slug || problemKey);

  let extractedCode = "";
  if (isOfficialHarness) {
    extractedCode = await billuAiService.generateOfficialHarnessSolution({
      title: title || cleanProblemTitle(problemKey) || problemKey,
      lang: cleanLang,
      officialCode: baseCode || "",
      customApiKey,
    });
  } else {
    let resolvedBaseCode = baseCode || "";
    let resolvedTimeComplexity = timeComplexity || "";
    let resolvedSpaceComplexity = spaceComplexity || "";
    let resolvedExplanation = explanation || "";

    if (!resolvedBaseCode) {
      try {
        const doc = await ProblemSolution.findOne({
          $or: [{ slug: targetSlug }, { aliases: targetSlug }, { key: targetSlug }],
        }).lean();
        if (doc?.approaches) {
          const appMatch = doc.approaches.find((a) => a.name?.toLowerCase().includes(targetApproach.toLowerCase()));
          if (appMatch) {
            resolvedBaseCode = appMatch.codes?.java || (typeof appMatch.code === "string" ? appMatch.code : "");
            resolvedTimeComplexity = resolvedTimeComplexity || appMatch.timeComplexity || "";
            resolvedSpaceComplexity = resolvedSpaceComplexity || appMatch.spaceComplexity || "";
            resolvedExplanation = resolvedExplanation || appMatch.explanation || "";
          }
        }
      } catch (lookupErr) {
        console.warn("[Practice:generateAiSolution] Fallback DB lookup error:", lookupErr.message);
      }
    }

    extractedCode = await billuAiService.generateStandaloneSolution({
      title: title || cleanProblemTitle(problemKey) || problemKey,
      approachName: targetApproach,
      lang: cleanLang,
      baseCode: resolvedBaseCode,
      timeComplexity: resolvedTimeComplexity,
      spaceComplexity: resolvedSpaceComplexity,
      explanation: resolvedExplanation,
      customApiKey,
    });
  }

  await ProblemSolution.findOneAndUpdate(
    { key: `${targetSlug}:${targetApproach}:${cleanLang}`, isAiGenerated: true },
    {
      $set: {
        slug: targetSlug,
        title: title || cleanProblemTitle(problemKey) || problemKey,
        isAiGenerated: true,
        aiModel: "gemini",
        promptVersion: promptVer,
        defaultCode: extractedCode,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).catch((err) => console.warn("[Practice:ProblemSolution] Mongo save notice:", err.message));

  return extractedCode;
}

async function compileSheetsForUser(progress) {
  const solvedSet = new Set(progress.solvedProblemKeys || []);
  const activeSheetIds = Array.isArray(progress.activeSheets) ? progress.activeSheets : [];

  const globalSheets = await GlobalSheet.find({}).lean().catch(() => []);
  const globalMap = new Map(globalSheets.map((g) => [g.id, g]));
  const allSheets = [];

  const BUILTIN_IDS = ["strivers-180", "sql-75", "codeforces-ladder", "neetcode-150", "strivers-a2z"];
  BUILTIN_IDS.forEach((id) => {
    const gs = globalMap.get(id) || getFallbackSheet(id);
    if (gs) {
      allSheets.push({
        id: gs.id,
        title: gs.title,
        description: gs.description || "Official developer roadmap.",
        total: (gs.problems || []).length,
        solved: calculateSolvedProblems(gs.problems, solvedSet),
        category: gs.category || "DSA Patterns",
        badge: gs.badge || "Developer / Admin",
        uploadedBy: "Developer / Admin",
        isOfficial: true,
        sourceUrl: gs.sourceUrl || "",
        lastSyncedAt: gs.lastSyncedAt || null,
        isEnrolled: activeSheetIds.includes(gs.id),
        isCustom: false,
      });
    }
  });

  globalSheets.forEach((gs) => {
    if (BUILTIN_IDS.includes(gs.id)) return;
    allSheets.push({
      id: gs.id,
      title: gs.title,
      description: gs.description || "Official developer roadmap.",
      total: (gs.problems || []).length,
      solved: calculateSolvedProblems(gs.problems, solvedSet),
      category: gs.category || "DSA Patterns",
      badge: gs.badge || "Developer / Admin",
      uploadedBy: gs.uploadedBy?.name || "Developer / Admin",
      isOfficial: true,
      sourceUrl: gs.sourceUrl || "",
      lastSyncedAt: gs.lastSyncedAt || null,
      isEnrolled: activeSheetIds.includes(gs.id),
      isCustom: false,
    });
  });

  (progress.customSheets || []).forEach((cs) => {
    if (globalMap.has(cs.id)) return;
    allSheets.push({
      id: cs.id,
      title: cs.title,
      description: cs.description || "Custom direct imported roadmap.",
      total: (cs.problems || []).length,
      solved: calculateSolvedProblems(cs.problems, solvedSet),
      category: "Custom",
      badge: cs.sourceUrl ? "Cloud Synced" : "Custom",
      uploadedBy: "You (Personal)",
      isOfficial: false,
      sourceUrl: cs.sourceUrl || "",
      lastSyncedAt: cs.lastSyncedAt || null,
      isEnrolled: activeSheetIds.includes(cs.id),
      isCustom: true,
    });
  });

  return {
    sheets: allSheets.filter((s) => s.isEnrolled),
    catalog: allSheets,
    activeSheets: activeSheetIds,
    totalSolved: solvedSet.size,
  };
}

async function handleProblemToggle({ userId, problemKey, action, title, leetcodeSlug, leetcodeId, id }) {
  const normKey = normalize(problemKey);
  const keysToTrack = new Set([normKey]);
  const rawTitle = title || problemKey;
  const cleanTitle = cleanProblemTitle(rawTitle);
  if (cleanTitle) keysToTrack.add(normalize(cleanTitle));
  if (rawTitle) keysToTrack.add(normalize(rawTitle));
  if (leetcodeSlug) keysToTrack.add(normalize(leetcodeSlug));
  if (leetcodeId) keysToTrack.add(String(leetcodeId));
  if (id) {
    keysToTrack.add(String(id));
    keysToTrack.add(normalize(id));
    keysToTrack.add("cf" + normalize(id));
  }

  const dbMatch = findProblemInDatabase(cleanTitle, rawTitle);
  if (dbMatch) {
    if (dbMatch.slug) keysToTrack.add(normalize(dbMatch.slug));
    if (dbMatch.id || dbMatch.questionId) keysToTrack.add(String(dbMatch.id || dbMatch.questionId));
  }

  const allKeys = Array.from(keysToTrack).filter(Boolean);
  let progress = await UserCodingProgress.findOne({ userId });
  if (!progress) {
    progress = await UserCodingProgress.create({ userId, solvedProblemKeys: [], starredProblemKeys: [] });
  }

  const solvedSet = new Set(progress?.solvedProblemKeys || []);
  const isCurrentlySolved = allKeys.some((k) => solvedSet.has(k));

  const candidateSlug = leetcodeSlug || dbMatch?.slug || cleanTitle || normKey;
  const canonicalKey = /^\d+$/.test(candidateSlug)
    ? normalize(cleanTitle || rawTitle || normKey)
    : normalize(candidateSlug);

  const today = getLocalDateString(new Date());

  if (action === "revert") {
    if (!isCurrentlySolved) {
      return { success: true, isSolved: false, reverted: false, problemKey: normKey, totalSolved: solvedSet.size };
    }
    const [updatedProgress] = await Promise.all([
      UserCodingProgress.findOneAndUpdate(
        { userId },
        { $pull: { solvedProblemKeys: { $in: allKeys } } },
        { new: true }
      ),
      DailyActivity.findOneAndUpdate(
        { userId, date: today },
        { $inc: { codingProblemsSolved: -1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
    ]);
    return { success: true, isSolved: false, reverted: true, problemKey: normKey, totalSolved: updatedProgress?.solvedProblemKeys?.length || 0 };
  }

  if (action === "solve") {
    if (isCurrentlySolved) {
      await UserCodingProgress.findOneAndUpdate(
        { userId },
        { $addToSet: { revisedProblemKeys: { $each: allKeys } } }
      );
      return { success: true, isSolved: true, alreadySolved: true, revisionDone: true, problemKey: normKey, totalSolved: solvedSet.size };
    }
    const [updatedProgress] = await Promise.all([
      UserCodingProgress.findOneAndUpdate(
        { userId },
        { $addToSet: { solvedProblemKeys: canonicalKey } },
        { new: true }
      ),
      DailyActivity.findOneAndUpdate(
        { userId, date: today },
        { $inc: { codingProblemsSolved: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
    ]);
    return { success: true, isSolved: true, alreadySolved: false, problemKey: normKey, totalSolved: updatedProgress?.solvedProblemKeys?.length || 0 };
  }

  const isSolved = !isCurrentlySolved;
  const [updatedProgress] = await Promise.all([
    UserCodingProgress.findOneAndUpdate(
      { userId },
      isCurrentlySolved
        ? { $pull: { solvedProblemKeys: { $in: allKeys } } }
        : { $addToSet: { solvedProblemKeys: canonicalKey } },
      { new: true }
    ),
    DailyActivity.findOneAndUpdate(
      { userId, date: today },
      { $inc: { codingProblemsSolved: isCurrentlySolved ? -1 : 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
  ]);

  return {
    success: true,
    isSolved,
    reverted: isCurrentlySolved,
    problemKey: normKey,
    totalSolved: updatedProgress?.solvedProblemKeys?.length || 0,
  };
}

module.exports = {
  loadData,
  loadTUF,
  parseCSV,
  getProblems,
  getProblemSolutionData,
  calculateSolvedProblems,
  extractProblemsFromInput,
  generateAiSolutionData,
  compileSheetsForUser,
  handleProblemToggle,
  findProblemInDatabase,
  resolveProblemItem,
  parseCsvProblems,
  parseTestCasesFromExamples,
  getFallbackSheet,
  formatSheetResponse,
  findLcSolFuzzy,
  mergeAiLanguages,
  hasProblemSolution,
  fetchContentFromUrl,
  catalogMap,
  leetcodeSolutionsMap,
  curatedSolutionsMap,
  codeforcesSolutionsMap,
  tufNonLeetcodeMap,
};
