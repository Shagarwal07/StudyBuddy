/**
 * notesService.js
 * 2-Phase Progressive Study Guide & Chapter Notes Synthesis Engine
 *
 * Implements:
 * 1. Lean Master Collection: AiVideoStudyGuide (Roadmap & Executive Overview only)
 * 2. Dedicated Chapter Collection: AiVideoModule (No 16MB document size limit risk)
 * 3. Race Condition Lock: Atomic lock with backoff polling prevents duplicate parallel LLM calls
 * 4. Grounded, Hallucination-Free Prompts: Strict adherence to transcripts without buzzwords
 * 5. On-Demand Stitching: Stitches master textbook dynamically on download/view without duplicate storage
 */

const { YoutubeTranscript } = require("youtube-transcript");
const { generateContent } = require("../../config/geminiClient");
const AiVideoStudyGuide = require("../../models/AiVideoStudyGuide");
const AiVideoModule = require("../../models/AiVideoModule");
const {
  NOTES_PROMPT_VERSION,
  buildRoadmapPrompt,
  buildModuleDeepPrompt,
  buildSinglePassDeepPrompt,
} = require("../../prompts/notesSynthesizer.prompt");
const { safeParseAiJson, parseChapterNotesResponse } = require("../../utils/aiJsonParser");
const { acquireLock, releaseLock, sleep } = require("../../utils/lockManager");
const { formatSeconds } = require("../../utils/formatTime");
const { awaitRateLimit } = require("../../utils/geminiRateLimiter");

/**
 * Fetches and normalizes raw transcript items with seconds
 */
async function fetchTranscriptSegments(ytVideoId) {
  if (!ytVideoId) return [];
  try {
    const raw = await YoutubeTranscript.fetchTranscript(ytVideoId);
    if (!Array.isArray(raw)) return [];
    return raw.map((item) => ({
      text: item.text || "",
      seconds: Math.floor((item.offset || 0) / 1000),
    }));
  } catch (err) {
    console.warn(`[NotesService] Transcript fetch notice for ${ytVideoId}:`, err.message);
    return [];
  }
}

/**
 * Uniformly samples transcript milestones across the full video duration
 */
function sampleTranscriptAcrossDuration(segments = [], durationInSeconds = 0) {
  if (!segments.length) return "";
  const totalDuration = durationInSeconds || segments[segments.length - 1]?.seconds || 3600;

  // Sample every ~60-90 seconds across the timeline (cap at 100 chunks)
  const step = Math.max(45, Math.floor(totalDuration / 100));
  const samples = [];
  let nextMark = 0;

  for (const seg of segments) {
    if (seg.seconds >= nextMark) {
      samples.push(`[${formatSeconds(seg.seconds)}] ${seg.text}`);
      nextMark = seg.seconds + step;
    }
  }

  return samples.join("\n");
}

/**
 * Filters and formats transcript for a specific module's time range
 */
function getModuleTranscript(segments = [], startSeconds = 0, endSeconds = 0) {
  if (!segments.length) return "";
  const filtered = segments.filter(
    (s) => s.seconds >= startSeconds && (endSeconds <= 0 || s.seconds <= endSeconds)
  );

  return filtered
    .map((s) => `[${formatSeconds(s.seconds)}] ${s.text}`)
    .join("\n");
}

/**
 * Stitches chapters into a complete master manual dynamically on demand
 */
function stitchFullGuide(overview = "", modules = []) {
  let guide = overview ? `# Course Overview\n\n${overview}\n\n---\n\n` : "";
  const sortedModules = [...modules].sort((a, b) => (a.moduleIndex || 0) - (b.moduleIndex || 0));

  for (const mod of sortedModules) {
    guide += `\n\n# Chapter ${mod.moduleIndex + 1}: ${mod.title}\n`;
    if (mod.timeFormatted) {
      guide += `*Timestamp: ${mod.timeFormatted}*\n\n`;
    }
    if (mod.markdownContent) {
      guide += `${mod.markdownContent}\n\n`;
    }
    if (Array.isArray(mod.keyInsights) && mod.keyInsights.length > 0) {
      guide += `### Key Insights:\n`;
      mod.keyInsights.forEach((insight) => {
        guide += `- ${insight}\n`;
      });
      guide += `\n`;
    }
    guide += `---\n`;
  }

  return guide.trim();
}

/**
 * Helper to fetch guide + modules and assemble the response expected by the client
 */
async function assembleFullGuideResponse(guideDoc) {
  let modules = (Array.isArray(guideDoc.modules) && guideDoc.modules.length > 0)
    ? guideDoc.modules
    : await AiVideoModule.find({
        ytVideoId: guideDoc.ytVideoId,
        promptVersion: guideDoc.promptVersion || NOTES_PROMPT_VERSION,
      })
        .sort({ moduleIndex: 1 })
        .lean();

  if (!modules || modules.length === 0) {
    modules = await AiVideoModule.find({
      ytVideoId: guideDoc.ytVideoId,
    })
      .sort({ moduleIndex: 1 })
      .lean();
  }

  const cachedIndices = modules.map((m) => m.moduleIndex);
  const modulesMap = Object.fromEntries(modules.map((m) => [String(m.moduleIndex), m]));
  const fullMarkdownGuide = stitchFullGuide(guideDoc.executiveOverview, modules);

  return {
    ...guideDoc,
    cachedModuleIndices: cachedIndices,
    modulesMap,
    fullMarkdownGuide,
  };
}

/**
 * 1. GET OR GENERATE INITIAL STUDY GUIDE
 * Prevents race conditions with atomic lock & backoff polling
 */
async function getOrGenerateStudyGuide({
  ytVideoId,
  videoTitle,
  durationInSeconds = 0,
  channelTitle = "",
  description = "",
  customApiKey = null,
}) {
  if (!ytVideoId) throw new Error("YouTube Video ID is required.");

  // 1. Instant Cache Check (<5ms)
  let cached = await AiVideoStudyGuide.findOne({
    ytVideoId,
    promptVersion: NOTES_PROMPT_VERSION,
  }).lean();

  if (!cached) {
    cached = await AiVideoStudyGuide.findOne({
      ytVideoId,
      status: "completed",
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
  }

  if (cached && cached.status !== "failed") {
    const fullGuide = await assembleFullGuideResponse(cached);
    return { fromCache: true, guide: fullGuide };
  }

  // 2. Race Condition Prevention: Atomic Lock with Backoff Polling
  const lockKey = `gen:${ytVideoId}`;
  let lockAcquired = false;
  const maxPollRetries = 15;

  for (let attempt = 0; attempt < maxPollRetries; attempt++) {
    lockAcquired = await acquireLock(lockKey, 180);
    if (lockAcquired) break;

    // Another process is generating: sleep 2 seconds and check if finished
    await sleep(2000);
    const pollCheck = await AiVideoStudyGuide.findOne({
      ytVideoId,
      promptVersion: NOTES_PROMPT_VERSION,
    }).lean();

    if (pollCheck && pollCheck.status !== "failed") {
      const fullGuide = await assembleFullGuideResponse(pollCheck);
      return { fromCache: true, guide: fullGuide };
    }
  }

  if (!lockAcquired) {
    throw new Error("Course study guide generation is currently in progress. Please refresh in a moment.");
  }

  // 3. Execution (We hold the atomic lock)
  try {
    const segments = await fetchTranscriptSegments(ytVideoId);
    const hasTranscript = segments.length > 0;
    const actualDuration = durationInSeconds || (segments.length ? segments[segments.length - 1].seconds : 0);

    // Fast path: Short videos (<= 30 mins)
    if (actualDuration > 0 && actualDuration <= 1800 && hasTranscript) {
      const fullTranscript = segments
        .map((s) => `[${formatSeconds(s.seconds)}] ${s.text}`)
        .join("\n");

      const prompt = buildSinglePassDeepPrompt({
        title: videoTitle,
        durationInSeconds: actualDuration,
        description,
        transcriptText: fullTranscript,
      });

      await awaitRateLimit();
      const res = await generateContent({
        contents: [{ parts: [{ text: prompt }] }],
        temperature: 0.15,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        customApiKey,
      });

      const parsed = safeParseAiJson(res.text, {
        executiveOverview: `Concise guide for ${videoTitle}`,
        roadmap: [
          {
            index: 0,
            title: videoTitle.slice(0, 40),
            startSeconds: 0,
            endSeconds: actualDuration,
            timeFormatted: `00:00 - ${formatSeconds(actualDuration)}`,
            overview: "Core content",
          },
        ],
        fullMarkdownGuide: res.text,
        keyInsights: [],
      });

      // Save lean roadmap doc
      const guideDoc = await AiVideoStudyGuide.findOneAndUpdate(
        { ytVideoId, promptVersion: NOTES_PROMPT_VERSION },
        {
          $set: {
            videoTitle,
            durationInSeconds: actualDuration,
            channelTitle,
            executiveOverview: parsed.executiveOverview || "",
            roadmap: parsed.roadmap || [],
            status: "completed",
            hasTranscript,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      ).lean();

      // Save Chapter 0 into separate AiVideoModule collection & mirror to AiVideoStudyGuide.modules
      const ch0Data = {
        title: parsed.roadmap?.[0]?.title || videoTitle,
        markdownContent: parsed.fullMarkdownGuide || "",
        keyInsights: parsed.keyInsights || [],
        startSeconds: 0,
        endSeconds: actualDuration,
        timeFormatted: `00:00 - ${formatSeconds(actualDuration)}`,
        isDetailed: true,
      };

      await AiVideoModule.findOneAndUpdate(
        { ytVideoId, moduleIndex: 0, promptVersion: NOTES_PROMPT_VERSION },
        { $set: ch0Data },
        { upsert: true }
      );

      await AiVideoStudyGuide.findOneAndUpdate(
        { ytVideoId },
        {
          $pull: { modules: { moduleIndex: 0 } },
        }
      );
      await AiVideoStudyGuide.findOneAndUpdate(
        { ytVideoId },
        {
          $push: { modules: { moduleIndex: 0, ...ch0Data } },
        }
      );

      const assembled = await assembleFullGuideResponse(guideDoc);
      return { fromCache: false, guide: assembled };
    }

    // Standard path: Phase 1 (Roadmap & Executive Overview)
    const timelineSamples = sampleTranscriptAcrossDuration(segments, actualDuration);
    const roadmapPrompt = buildRoadmapPrompt({
      title: videoTitle,
      durationInSeconds: actualDuration,
      description,
      transcriptSamples: timelineSamples || description,
    });

    await awaitRateLimit();
    const roadmapRes = await generateContent({
      contents: [{ parts: [{ text: roadmapPrompt }] }],
      temperature: 0.15,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      customApiKey,
    });

    const parsedRoadmap = safeParseAiJson(roadmapRes.text, {
      executiveOverview: `Comprehensive master roadmap for ${videoTitle}`,
      roadmap: [],
    });

    const rawModules = Array.isArray(parsedRoadmap.roadmap) ? parsedRoadmap.roadmap : [];
    const normalizedRoadmap = rawModules.map((m, idx) => ({
      index: idx,
      title: m.title ? String(m.title).trim().slice(0, 50) : `Chapter ${idx + 1}`,
      startSeconds: Math.max(0, Math.floor(Number(m.startSeconds) || 0)),
      endSeconds: Math.max(0, Math.floor(Number(m.endSeconds) || 0)),
      timeFormatted: m.timeFormatted || `${formatSeconds(m.startSeconds)} - ${formatSeconds(m.endSeconds)}`,
      overview: m.overview ? String(m.overview).trim().slice(0, 200) : "",
    }));

    // Save lean roadmap doc (NO 16MB bloat)
    const guideDoc = await AiVideoStudyGuide.findOneAndUpdate(
      { ytVideoId, promptVersion: NOTES_PROMPT_VERSION },
      {
        $set: {
          videoTitle,
          durationInSeconds: actualDuration,
          channelTitle,
          executiveOverview: parsedRoadmap.executiveOverview || "",
          roadmap: normalizedRoadmap,
          status: "completed",
          hasTranscript,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean();

    // Auto-synthesize Chapter 0 immediately so student has the first chapter ready on load
    if (normalizedRoadmap.length > 0) {
      const mod0 = normalizedRoadmap[0];
      const mod0Transcript = getModuleTranscript(segments, mod0.startSeconds, mod0.endSeconds);

      const mod0Prompt = buildModuleDeepPrompt({
        courseTitle: videoTitle,
        moduleTitle: mod0.title,
        moduleIndex: 0,
        totalModules: normalizedRoadmap.length,
        startSeconds: mod0.startSeconds,
        endSeconds: mod0.endSeconds,
        timeFormatted: mod0.timeFormatted,
        moduleTranscript: mod0Transcript || mod0.overview,
      });

      try {
        const mod0Res = await generateContent({
          contents: [{ parts: [{ text: mod0Prompt }] }],
          temperature: 0.15,
          maxOutputTokens: 8192,
          customApiKey,
        });

        const parsedMod0 = parseChapterNotesResponse(mod0Res.text, mod0.overview);

        await AiVideoModule.findOneAndUpdate(
          { ytVideoId, moduleIndex: 0, promptVersion: NOTES_PROMPT_VERSION },
          {
            $set: {
              title: mod0.title,
              markdownContent: parsedMod0.markdownContent || "",
              keyInsights: parsedMod0.keyInsights || [],
              startSeconds: mod0.startSeconds,
              endSeconds: mod0.endSeconds,
              timeFormatted: mod0.timeFormatted,
            },
          },
          { upsert: true }
        );
      } catch (mod0Err) {
        console.warn("[NotesService] Chapter 0 auto-synthesis notice:", mod0Err.message);
      }
    }

    const assembled = await assembleFullGuideResponse(guideDoc);
    return { fromCache: false, guide: assembled };
  } finally {
    await releaseLock(lockKey);
  }
}

/**
 * 2. SYNTHESIZE SPECIFIC MODULE & SAVE TO AiVideoModule
 * Protected with per-chapter atomic lock
 */
async function generateModuleDeepNotes({
  ytVideoId,
  moduleIndex,
  customApiKey = null,
}) {
  const modIdx = Number(moduleIndex);

  // 1. Instant Cache Check (<5ms)
  let existingMod = await AiVideoModule.findOne({
    ytVideoId,
    moduleIndex: modIdx,
    promptVersion: NOTES_PROMPT_VERSION,
  }).lean();

  if (!existingMod) {
    existingMod = await AiVideoModule.findOne({
      ytVideoId,
      moduleIndex: modIdx,
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
  }

  let guide = await AiVideoStudyGuide.findOne({
    ytVideoId,
    promptVersion: NOTES_PROMPT_VERSION,
  }).lean();

  if (!guide) {
    guide = await AiVideoStudyGuide.findOne({
      ytVideoId,
      status: "completed",
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
  }

  if (!guide) {
    throw new Error("Course study guide roadmap not found. Please initialize roadmap first.");
  }

  if (existingMod && existingMod.markdownContent) {
    const fullGuide = await assembleFullGuideResponse(guide);
    return { fromCache: true, module: existingMod, guide: fullGuide };
  }

  const targetRoadmap = guide.roadmap.find((m) => m.index === modIdx);
  if (!targetRoadmap) {
    throw new Error(`Chapter ${moduleIndex} does not exist in the course roadmap.`);
  }

  // 2. Atomic Lock for this chapter with polling
  const modLockKey = `gen:${ytVideoId}_${modIdx}`;
  let lockAcquired = false;
  const maxPollRetries = 15;

  for (let attempt = 0; attempt < maxPollRetries; attempt++) {
    lockAcquired = await acquireLock(modLockKey, 120);
    if (lockAcquired) break;

    await sleep(2000);
    const checkAgain = await AiVideoModule.findOne({
      ytVideoId,
      moduleIndex: modIdx,
      promptVersion: NOTES_PROMPT_VERSION,
    }).lean();

    if (checkAgain && checkAgain.markdownContent) {
      const fullGuide = await assembleFullGuideResponse(guide);
      return { fromCache: true, module: checkAgain, guide: fullGuide };
    }
  }

  if (!lockAcquired) {
    throw new Error(`Chapter ${moduleIndex + 1} synthesis is currently in progress. Please wait.`);
  }

  try {
    const segments = await fetchTranscriptSegments(ytVideoId);
    const modTranscript = getModuleTranscript(segments, targetRoadmap.startSeconds, targetRoadmap.endSeconds);

    const prompt = buildModuleDeepPrompt({
      courseTitle: guide.videoTitle,
      moduleTitle: targetRoadmap.title,
      moduleIndex: targetRoadmap.index,
      totalModules: guide.roadmap.length,
      startSeconds: targetRoadmap.startSeconds,
      endSeconds: targetRoadmap.endSeconds,
      timeFormatted: targetRoadmap.timeFormatted,
      moduleTranscript: modTranscript || targetRoadmap.overview,
    });

    const res = await generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      temperature: 0.15,
      maxOutputTokens: 8192,
      customApiKey,
    });

    const parsedMod = parseChapterNotesResponse(res.text, targetRoadmap.overview);

    const moduleSubdoc = {
      moduleIndex: modIdx,
      title: targetRoadmap.title,
      markdownContent: parsedMod.markdownContent || "",
      keyInsights: parsedMod.keyInsights || [],
      startSeconds: targetRoadmap.startSeconds,
      endSeconds: targetRoadmap.endSeconds,
      timeFormatted: targetRoadmap.timeFormatted,
      isDetailed: true,
    };

    const savedModule = await AiVideoModule.findOneAndUpdate(
      { ytVideoId, moduleIndex: modIdx, promptVersion: NOTES_PROMPT_VERSION },
      { $set: moduleSubdoc },
      { upsert: true, returnDocument: "after" }
    ).lean();

    await AiVideoStudyGuide.findOneAndUpdate(
      { ytVideoId },
      {
        $pull: { modules: { moduleIndex: modIdx } },
      }
    );
    await AiVideoStudyGuide.findOneAndUpdate(
      { ytVideoId },
      {
        $push: { modules: moduleSubdoc },
      }
    );

    const fullGuide = await assembleFullGuideResponse(guide);
    return { fromCache: false, module: savedModule, guide: fullGuide };
  } finally {
    await releaseLock(modLockKey);
  }
}

module.exports = {
  getOrGenerateStudyGuide,
  generateModuleDeepNotes,
  stitchFullGuide,
  assembleFullGuideResponse,
  NOTES_PROMPT_VERSION,
};
