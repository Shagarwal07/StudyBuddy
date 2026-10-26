/**
 * youtubeVideoHandler.js
 * Grounded YouTube lecture doubt clearing and zero-LLM-cost roadmap suggestions
 */

const { YoutubeTranscript } = require("youtube-transcript");
const agentCore = require("../core/agentCore");
const Video = require("../../../models/Video");
const AiVideoStudyGuide = require("../../../models/AiVideoStudyGuide");
const TranscriptChunk = require("../../../models/TranscriptChunk");
const { BILLU_YOUTUBE_TUTOR_PROMPT } = require("../../../prompts/youtubeDoubt.prompt");
const { ensureEmbeddings, searchRelevantChunks, ensureVideoNotes } = require("../embeddingService");

// Cache transcripts in memory to avoid repeated external fetches
const transcriptCache = new Map();

async function getRawTranscript(ytVideoId) {
  if (!ytVideoId) return [];
  if (transcriptCache.has(ytVideoId)) {
    return transcriptCache.get(ytVideoId);
  }
  try {
    const raw = await YoutubeTranscript.fetchTranscript(ytVideoId);
    if (Array.isArray(raw)) {
      transcriptCache.set(ytVideoId, raw);
      if (transcriptCache.size > 150) {
        const firstKey = transcriptCache.keys().next().value;
        transcriptCache.delete(firstKey);
      }
      return raw;
    }
  } catch (err) {
    console.warn(`[YouTubeHandler] Transcript fetch failed for ${ytVideoId}:`, err.message);
  }
  return [];
}

/**
 * Extracts transcript text sliced between startSec and endSec
 */
async function getTranscriptSlice(ytVideoId, startSec, endSec) {
  if (!ytVideoId) return "";
  const minSec = Math.max(0, startSec);
  const maxSec = Math.max(minSec, endSec);

  try {
    const chunks = await TranscriptChunk.find({
      ytVideoId,
      startSeconds: { $lte: maxSec },
      endSeconds: { $gte: minSec },
    })
      .sort({ chunkIndex: 1 })
      .lean();

    if (chunks.length > 0) {
      return chunks.map((c) => c.text?.trim()).filter(Boolean).join(" ");
    }
  } catch (dbErr) {
    console.warn("[YouTubeHandler] TranscriptChunk DB lookup notice:", dbErr.message);
  }

  const raw = await getRawTranscript(ytVideoId);
  if (!raw || !raw.length) return "";

  const matched = raw
    .filter((item) => {
      const sec = Math.floor((item.offset || 0) / 1000);
      return sec >= minSec && sec <= maxSec;
    })
    .map((item) => item.text?.trim())
    .filter(Boolean);

  return matched.join(" ");
}

/**
 * Chat executor invoking agentCore
 */
async function executeChat(messages, systemInstruction, temperature = 0.25, customApiKey = null) {
  return await agentCore.executeChat(messages, systemInstruction, temperature);
}

/**
 * Handles conversational doubt clearing grounded in an active YouTube video and timestamp
 */
async function handleYouTubeChat({
  message,
  history = [],
  youtubeContext = null,
  videoContext = null,
  mode = null,
  customApiKey = null,
}) {
  const ctx = youtubeContext || videoContext || {};
  const activeMode = mode || ctx.mode || null; // "INSTANT" | "WAIT_FULL" | null
  const ts = typeof ctx.timestampSeconds === "number" ? ctx.timestampSeconds : 0; // e.g. 742
  const ytVideoId = ctx.ytVideoId || ctx.videoId;
  const timeStr = ctx.timestamp || `${Math.floor(ts / 60)}:${String(ts % 60).padStart(2, "0")}`;
  const videoTitle = ctx.videoTitle || "Lecture";
  const cleanMsg = String(message || "").trim();
  const lowerMsg = cleanMsg.toLowerCase();

  // 1. Handle short affirmative inputs like "yes", "ok", "next" (Zero-delay jump)
  const isShortAffirmative =
    ["yes", "ok", "okay", "proceed", "next", "sure", "yep", "continue", "go ahead"].includes(lowerMsg) ||
    (cleanMsg.length < 4 && cleanMsg.length > 0);

  if (isShortAffirmative && ytVideoId) {
    const guide = await AiVideoStudyGuide.findOne({ ytVideoId }).lean();
    if (guide && Array.isArray(guide.roadmap) && guide.roadmap.length > 1) {
      const module =
        guide.modules?.find((m) => ts >= m.startSeconds && (m.endSeconds ? ts <= m.endSeconds : true)) ||
        guide.roadmap.find((r) => ts >= r.startSeconds && ts < r.endSeconds) ||
        guide.roadmap[0];

      const currentChapterTitle = module?.title || guide.roadmap[0].title;
      const currentIdx = guide.roadmap.findIndex((r) => r.title === currentChapterTitle);
      const nextIdx = currentIdx >= 0 && currentIdx + 1 < guide.roadmap.length ? currentIdx + 1 : 1;
      const next = guide.roadmap[nextIdx] || guide.roadmap[1];

      let firstCode = 'print("Hello World")';
      const nextModule = guide.modules?.find(
        (m) => m.moduleIndex === (next.index !== undefined ? next.index : nextIdx)
      );
      if (nextModule?.codeSnippets?.length > 0) {
        firstCode = nextModule.codeSnippets[0];
      } else {
        const codeMatch = nextModule?.markdownContent?.match(
          /```(?:python|bash|java|javascript|cpp|csharp)?\s*([\s\S]*?)```/i
        );
        if (codeMatch && codeMatch[1]) {
          firstCode = codeMatch[1].trim();
        }
      }

      return `Great, let's jump to ${next.title}:\n${
        next.overview || "In this chapter, we dive into hands-on implementation and core syntax."
      }\n\nFirst code:\n\`\`\`python\n${firstCode}\n\`\`\`\nWant to run it or break down the syntax?`;
    }
  }

  // 2. Indexing State Check & Mode Orchestration
  if (ytVideoId) {
    const [videoDoc, guideDoc] = await Promise.all([
      Video.findOne({ ytVideoId }).select("hasEmbeddings embeddingStatus hasDetailedNotes isDetailed").lean(),
      AiVideoStudyGuide.findOne({ ytVideoId }).select("hasEmbeddings embeddingStatus hasDetailedNotes isDetailed").lean(),
    ]);

    const isEmbeddingDone =
      (videoDoc?.hasEmbeddings && videoDoc?.embeddingStatus === "done") ||
      (guideDoc?.hasEmbeddings && guideDoc?.embeddingStatus === "done");
    const isNotesDone = Boolean(
      (videoDoc?.hasDetailedNotes && videoDoc?.isDetailed) ||
      (guideDoc?.hasDetailedNotes && guideDoc?.isDetailed)
    );

    // If not yet fully indexed and user hasn't specified mode: trigger 10% popup
    if (!activeMode && (!isEmbeddingDone || !isNotesDone)) {
      console.log(`[YouTubeHandler] Unindexed video ${ytVideoId}. Initiating parallel embedding (10% partial) & notes...`);
      // Fire-and-forget notes generation in background
      ensureVideoNotes(ytVideoId, customApiKey).catch(() => {});

      const embeddingPromise = ensureEmbeddings(ytVideoId, { allowPartial: true, customApiKey });
      const embedResult = await embeddingPromise;

      if (embedResult?.partial) {
        console.log(`[YouTubeHandler] Emitting PARTIAL_READY popup for ${ytVideoId} at ${embedResult.progress}%`);
        return {
          type: "PARTIAL_READY",
          popup: {
            title: "AI indexing 10%",
            body: "Instant answer from 10% or wait 60s for full?",
          },
          progress: embedResult.progress || 10,
          partialChunks: embedResult.chunksSoFar || 0,
          ytVideoId,
        };
      }
    } else if (activeMode === "WAIT_FULL") {
      console.log(`[YouTubeHandler] mode=WAIT_FULL: awaiting full embeddings and full notes for ${ytVideoId}...`);
      await Promise.all([
        ensureEmbeddings(ytVideoId, { allowPartial: false, customApiKey }),
        ensureVideoNotes(ytVideoId, customApiKey),
      ]);
    } else if (activeMode === "INSTANT") {
      console.log(`[YouTubeHandler] mode=INSTANT: searching available partial index and generating quick answer for ${ytVideoId}...`);
      // Ensure background notes continue non-blocking
      ensureVideoNotes(ytVideoId, customApiKey).catch(() => {});
    }
  }

  // 3. Fetch Grounded Context (single findOne on AiVideoStudyGuide, no separate collection join)
  const [guide, relevantChunks, rawTranscriptSlice] = await Promise.all([
    ytVideoId ? AiVideoStudyGuide.findOne({ ytVideoId }).lean() : null,
    ytVideoId ? searchRelevantChunks(ytVideoId, cleanMsg, ts, customApiKey) : [],
    getTranscriptSlice(ytVideoId, ts - 60, ts + 60),
  ]);

  const module =
    guide?.modules?.find((m) => ts >= m.startSeconds && (m.endSeconds ? ts <= m.endSeconds : true)) ||
    guide?.roadmap?.find((r) => ts >= r.startSeconds && ts < r.endSeconds) ||
    null;

  // Format primary relevant transcript parts
  let relevantTranscriptText = "";
  if (Array.isArray(relevantChunks) && relevantChunks.length > 0) {
    relevantTranscriptText = relevantChunks
      .map(
        (c) =>
          `[${c.timeFormatted || `${Math.floor((c.startSeconds || 0) / 60)}:${String((c.startSeconds || 0) % 60).padStart(2, "0")}`}] ${c.text}`
      )
      .join("\n\n");
    console.log(`[Billu AI:YouTube] ${relevantChunks.length} vector chunks injected (${activeMode || "normal"}) for "${cleanMsg.slice(0, 30)}" around ${ts}s`);
  } else if (rawTranscriptSlice) {
    relevantTranscriptText = rawTranscriptSlice;
    console.log(`[Billu AI:YouTube] Fallback raw transcript slice injected around ${ts}s`);
  } else {
    relevantTranscriptText = "No direct transcript slice found.";
  }

  const currentChapter =
    module?.title ||
    guide?.roadmap?.find((r) => ts >= r.startSeconds && ts < r.endSeconds)?.title ||
    "this chapter";

  const nextChapter =
    guide && Array.isArray(guide.roadmap)
      ? guide.roadmap[guide.roadmap.findIndex((r) => r.title === currentChapter) + 1]
      : null;

  // Format secondary chapter notes or fallback to notes
  let chapterNotesText = "";
  if (Array.isArray(module?.keyInsights) && module.keyInsights.length > 0) {
    chapterNotesText = module.keyInsights.join("\n- ");
  } else if (module?.markdownContent) {
    chapterNotesText = module.markdownContent.slice(0, 600);
  } else if (guide?.roadmap) {
    const curRoadmap = guide.roadmap.find((r) => ts >= r.startSeconds && ts < r.endSeconds) || guide.roadmap[0];
    chapterNotesText = curRoadmap?.overview || "Introductory roadmap overview.";
  } else {
    chapterNotesText = "Notes are being indexed in background.";
  }

  // 4. Context Header - Embedding Primary + Chapter Notes Secondary + Fallback
  const contextHeader = `
ACTIVE LECTURE CONTEXT:
Video: ${videoTitle}
Chapter: ${currentChapter} at ${timeStr} (${ts}s)

RELEVANT TRANSCRIPT PARTS (Primary Source):
${relevantTranscriptText}

CHAPTER NOTES (Secondary Source):
${chapterNotesText}

Next Chapter:
${nextChapter?.title || "none"}
`;

  const historyText = (history || [])
    .map((m) => String(m.content || m.text || "").toLowerCase())
    .join(" ");

  const hasAlreadyAskedCta =
    historyText.includes("next chapter") ||
    historyText.includes("move to next") ||
    historyText.includes("jump to");

  const isInstantMode = activeMode === "INSTANT";

  const systemInstruction = `
You are Billu, friendly YouTube coding tutor. Conversational, concise, and direct.

CONTEXT YOU GET:
- Current chapter: ${currentChapter} at ${timeStr}
- Next chapter: ${nextChapter?.title || "none"}

ANSWER RULES:

1. DEFINITION QUESTIONS (e.g. "what is variable", "what is print", "what is a loop"):
   - Give a crisp definition in 1 line, then 1 code example.
   - Example GOOD for "what is variable":
     "A variable is a named box that stores data. Like: x = 10 stores 10 in x. You can then use x later."
     Include a python code block.
   - Don't mention installation, don't say "From the chapter notes:", just answer directly.

2. PREVIEW QUESTIONS (e.g. "What is First Program and Variables?"):
   - If question is about NEXT chapter while at 0:00 or current chapter, give a 2-line preview + 1 example, but NEVER refuse.
   - BAD: "That comes up in next chapter!"
   - GOOD: "In next chapter you write print('Hello') and learn variables as containers. Eg: name = 'Billu'"

3. NO FILLER - BANNED SENTENCES:
   NEVER say:
   - "Even though the very start of the lecture focuses on installing..."
   - "From the chapter notes:"
   - "Hey there! From the chapter notes:"
   - "This wasn't covered at this timestamp, but based on notes..."
   Just answer directly.

4. CTA RULE:
   - Ask "Want to move to next chapter?" only ONCE per conversation.
   ${
     hasAlreadyAskedCta
       ? "- User or assistant already discussed or asked about the next chapter in history. DO NOT ask 'Want to move to next chapter?' again."
       : "- If user already said 'yes' or asked follow-up, don't ask again."
   }

5. FOLLOW-UP "what is variable" after you already explained:
   - Don't repeat same definition. Go deeper:
     "We saw variable as named container. In Python you don't declare type: x=5 is int, name='hi' is string. Python figures type automatically. Want to try?"

6. CODE & LENGTH:
   - Always show 1 code example for coding terms. Use clean markdown code blocks.
   - ${isInstantMode ? "INSTANT MODE: Max 150 words. Prioritize primary transcript excerpts with secondary chapter notes." : "Max 150 words."}
   - NO EMOJIS anywhere.
`;

  const safeHistory = (history || [])
    .slice(-6)
    .map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
      content: String(m.content || m.text || "").slice(0, 800),
    }));

  return await executeChat(
    [
      ...safeHistory,
      {
        role: "user",
        content: contextHeader + "\n\nStudent Question: " + cleanMsg,
      },
    ],
    systemInstruction,
    0.25,
    customApiKey
  );
}

/**
 * Suggestions - ZERO LLM COST:
 * Directly derived from AiVideoStudyGuide roadmap
 */
async function handleYouTubeSuggestions(arg1, arg2) {
  let ytVideoId = "";
  let playhead = 0;

  if (typeof arg1 === "object" && arg1 !== null) {
    const ctx = arg1.youtubeContext || arg1.videoContext || {};
    ytVideoId = arg1.ytVideoId || ctx.ytVideoId || ctx.videoId || "";
    playhead =
      typeof arg1.playhead === "number"
        ? arg1.playhead
        : typeof ctx.timestampSeconds === "number"
        ? ctx.timestampSeconds
        : 0;
  } else {
    ytVideoId = arg1 || "";
    playhead = typeof arg2 === "number" ? arg2 : 0;
  }

  if (!ytVideoId) return [];

  const guide = await AiVideoStudyGuide.findOne({ ytVideoId });
  if (!guide || !Array.isArray(guide.roadmap) || guide.roadmap.length === 0) {
    return [];
  }

  const curr =
    guide.roadmap.find((r) => playhead >= r.startSeconds && playhead < r.endSeconds) ||
    guide.roadmap[0];

  const currIdx =
    curr.index !== undefined
      ? curr.index
      : guide.roadmap.findIndex((r) => r.title === curr.title);

  const next = guide.roadmap[currIdx + 1];

  return [
    `Explain ${curr.title} in simple terms`,
    `Give example from ${curr.title}`,
    next ? `What is ${next.title}?` : `Summarize this chapter`,
  ];
}

module.exports = {
  getTranscriptSlice,
  executeChat,
  handleYouTubeChat,
  handleYouTubeSuggestions,
  // Backward compatibility aliases
  chatWithYouTubeBillu: handleYouTubeChat,
  suggestYouTubeQuestions: handleYouTubeSuggestions,
  chatWithVideoBillu: handleYouTubeChat,
  suggestVideoQuestions: handleYouTubeSuggestions,
};
