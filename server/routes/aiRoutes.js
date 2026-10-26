const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const billuAiService = require("../services/billuAiService");

// Top-level model imports (eliminates in-handler synchronous require overhead)
const Video = require("../models/Video");
const AiVideoStudyGuide = require("../models/AiVideoStudyGuide");
const TranscriptChunk = require("../models/TranscriptChunk");

router.use(authMiddleware);

const DEFAULT_DSA_SUGGESTIONS = [
  "What is the optimal time and space complexity?",
  "Give me a gentle conceptual hint",
  "Walk through a dry run on an example",
];

const DEFAULT_YOUTUBE_SUGGESTIONS = [
  "Explain what was just discussed in simple terms",
  "What are the core takeaways from this section?",
  "Give an intuitive real-world example",
];

/**
 * 1. DSA Practice Problem Chat
 */
router.post("/chat", async (req, res) => {
  try {
    const { message, history, problemContext, customApiKey } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const reply = await billuAiService.chatWithBillu({
      message,
      history,
      problemContext,
      customApiKey,
    });

    res.json({
      success: true,
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AI:chat]", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Billu AI encountered an issue processing your request.",
    });
  }
});

/**
 * 2. Dynamic Question Suggestions (Practice) — Graceful Degradation on AI Error
 */
router.post("/suggest", async (req, res) => {
  try {
    const { problemContext, history, customApiKey } = req.body;

    const suggestions = await billuAiService.suggestQuestions({
      problemContext: problemContext || {},
      history: history || [],
      customApiKey,
    });

    res.json({
      success: true,
      suggestions: Array.isArray(suggestions) && suggestions.length > 0 ? suggestions : DEFAULT_DSA_SUGGESTIONS,
    });
  } catch (error) {
    console.warn("[AI:suggest] Gemini unavailable, falling back to defaults:", error.message);
    // Graceful 200 response with defaults prevents client toast error
    res.json({
      success: true,
      suggestions: DEFAULT_DSA_SUGGESTIONS,
      fallback: true,
    });
  }
});

/**
 * 3. YouTube Lecture Doubt Clearing
 */
router.post("/youtube-chat", async (req, res) => {
  try {
    const { message, history, youtubeContext, videoContext, mode, customApiKey } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const result = await billuAiService.chatWithYouTubeBillu({
      message,
      history,
      youtubeContext: youtubeContext || videoContext,
      mode,
      customApiKey,
    });

    if (result && typeof result === "object" && result.type === "PARTIAL_READY") {
      return res.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      reply: typeof result === "string" ? result : result?.reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AI:youtube-chat]", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Billu AI encountered an issue processing your YouTube lecture doubt.",
    });
  }
});

/**
 * 4. Dynamic Question Suggestions (YouTube) — Graceful Degradation on AI Error
 */
router.post("/youtube-suggest", async (req, res) => {
  try {
    const { ytVideoId, playhead, youtubeContext, videoContext, history, customApiKey } = req.body;

    const suggestions = await billuAiService.suggestYouTubeQuestions({
      ytVideoId,
      playhead,
      youtubeContext: youtubeContext || videoContext || {},
      history: history || [],
      customApiKey,
    });

    res.json({
      success: true,
      suggestions: Array.isArray(suggestions) && suggestions.length > 0 ? suggestions : DEFAULT_YOUTUBE_SUGGESTIONS,
    });
  } catch (error) {
    console.warn("[AI:youtube-suggest] Gemini unavailable, falling back to defaults:", error.message);
    res.json({
      success: true,
      suggestions: DEFAULT_YOUTUBE_SUGGESTIONS,
      fallback: true,
    });
  }
});

/**
 * 5. YouTube Lecture Vector Embedding Status & Progress
 */
router.get("/youtube-embedding-status/:ytVideoId", async (req, res) => {
  try {
    const { ytVideoId } = req.params;

    if (!ytVideoId || !ytVideoId.trim()) {
      return res.status(400).json({ success: false, message: "ytVideoId parameter is required." });
    }

    const [video, guide, chunkCount] = await Promise.all([
      Video.findOne({ ytVideoId })
        .select("hasEmbeddings embeddingStatus embeddingProgress embeddingVersion lastEmbeddingError")
        .lean(),
      AiVideoStudyGuide.findOne({ ytVideoId })
        .select("hasEmbeddings embeddingStatus embeddingProgress embeddingVersion lastEmbeddingError")
        .lean(),
      TranscriptChunk.countDocuments({ ytVideoId }),
    ]);

    const isDone =
      (video?.hasEmbeddings && video?.embeddingStatus === "done") ||
      (guide?.hasEmbeddings && guide?.embeddingStatus === "done");
    const status = isDone
      ? "done"
      : video?.embeddingStatus || guide?.embeddingStatus || (chunkCount > 0 ? "embedding" : "pending");
    const progress = isDone
      ? 100
      : video?.embeddingProgress ?? guide?.embeddingProgress ?? (chunkCount > 0 ? 10 : 0);

    res.json({
      success: true,
      hasEmbeddings: isDone,
      embeddingStatus: status,
      embeddingProgress: progress,
      chunkCount,
      version: video?.embeddingVersion || guide?.embeddingVersion || "text-embedding-004-v1",
      lastError: video?.lastEmbeddingError || guide?.lastEmbeddingError || null,
    });
  } catch (error) {
    console.error("[AI:youtube-embedding-status]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
