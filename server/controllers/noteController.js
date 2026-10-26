const Note = require("../models/Note");
const Video = require("../models/Video");
const Playlist = require("../models/Playlist");

// GET /api/videos/:videoId/notes
exports.getNotesByVideo = async (req, res) => {
  try {
    const notes = await Note.find({ videoId: req.params.videoId, userId: req.user.id })
      .sort({ timestamp: 1 })
      .lean();

    res.json({ success: true, notes });
  } catch (error) {
    console.error("[Get Notes]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch video notes" });
  }
};

// POST /api/videos/:videoId/notes
exports.createNote = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { timestamp = 0, noteText } = req.body;

    if (!noteText?.trim()) {
      return res.status(400).json({ success: false, message: "Note text is required" });
    }

    const video = await Video.findById(videoId, "playlistId").lean();
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const ownsPlaylist = await Playlist.exists({ _id: video.playlistId, userId: req.user.id });
    if (!ownsPlaylist) {
      return res.status(403).json({ success: false, message: "Unauthorized to add notes to this video" });
    }

    const note = await Note.create({
      videoId,
      playlistId: video.playlistId,
      userId: req.user.id,
      timestamp: Math.max(0, Math.floor(Number(timestamp) || 0)),
      noteText: noteText.trim(),
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    console.error("[Create Note]", error.message);
    res.status(500).json({ success: false, message: "Failed to create note" });
  }
};

// PUT /api/notes/:id
exports.updateNote = async (req, res) => {
  try {
    const update = {};
    if (req.body.noteText !== undefined) update.noteText = req.body.noteText.trim();
    if (req.body.timestamp !== undefined) update.timestamp = Math.max(0, Math.floor(Number(req.body.timestamp) || 0));

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: update },
      { returnDocument: "after", runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found or unauthorized" });
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error("[Update Note]", error.message);
    res.status(500).json({ success: false, message: "Failed to update note" });
  }
};

// DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found or unauthorized" });
    }

    res.json({ success: true, message: "Note deleted successfully", noteId: req.params.id });
  } catch (error) {
    console.error("[Delete Note]", error.message);
    res.status(500).json({ success: false, message: "Failed to delete note" });
  }
};

// POST /api/videos/:videoId/ai-notes
exports.generateAiNotesForVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { customApiKey, additionalContext, replaceExisting = false } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const ownsPlaylist = await Playlist.exists({ _id: video.playlistId, userId: req.user.id });
    if (!ownsPlaylist) {
      return res.status(403).json({ success: false, message: "Unauthorized to generate notes for this video" });
    }

    const billuAiService = require("../services/billuAiService");

    const result = await billuAiService.getOrGenerateStudyGuide({
      ytVideoId: video.ytVideoId,
      videoTitle: video.title,
      description: video.description,
      durationInSeconds: video.durationInSeconds,
      customApiKey,
    });

    if (result.guide?.fullMarkdownGuide) {
      video.notes = result.guide.fullMarkdownGuide;
      await video.save();
    }

    res.json({
      success: true,
      message: "Study notes synthesized successfully by Billu AI!",
      guide: result.guide,
      fromCache: result.fromCache,
      videoNotes: video.notes,
    });
  } catch (error) {
    console.error("[AI Video Notes]", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI notes for video",
    });
  }
};

// In-flight map prevents duplicate concurrent Gemini jobs for the same video/module
const inFlightGuideJobs = new Map();

// GET /api/videos/guide/:ytVideoId
// Ultra-fast (<50ms) global knowledge cache lookup
exports.getGlobalStudyGuide = async (req, res) => {
  try {
    const { ytVideoId } = req.params;
    const billuAiService = require("../services/billuAiService");
    const AiVideoStudyGuide = require("../models/AiVideoStudyGuide");
    const { assembleFullGuideResponse } = require("../services/ai/notesService");

    const promptVersion = billuAiService.NOTES_PROMPT_VERSION || 3;

    let cached = await AiVideoStudyGuide.findOne({
      ytVideoId,
      promptVersion,
    }).lean();

    if (!cached) {
      cached = await AiVideoStudyGuide.findOne({
        ytVideoId,
        status: "completed",
      })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean();
    }

    if (cached) {
      const fullGuide = await assembleFullGuideResponse(cached);
      if (fullGuide.fullMarkdownGuide) {
        Video.updateMany(
          { ytVideoId },
          { $set: { notes: fullGuide.fullMarkdownGuide } }
        ).catch(() => {});
      }
      return res.json({
        success: true,
        fromCache: true,
        guide: fullGuide,
      });
    }

    return res.json({
      success: true,
      fromCache: false,
      guide: null,
      message: "No cached study guide found for this video. Call POST to generate.",
    });
  } catch (err) {
    console.error("[GetGlobalStudyGuide]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/videos/guide/:ytVideoId
// Generate or fetch global master study guide (Roadmap + Module 0)
exports.generateGlobalStudyGuide = async (req, res) => {
  const { ytVideoId } = req.params;
  const { videoTitle, durationInSeconds, channelTitle, description, customApiKey } = req.body || {};

  if (!ytVideoId) {
    return res.status(400).json({ success: false, message: "ytVideoId is required." });
  }

  const flightKey = `guide_${ytVideoId}`;
  if (inFlightGuideJobs.has(flightKey)) {
    try {
      const existingResult = await inFlightGuideJobs.get(flightKey);
      return res.json({ success: true, fromCache: true, guide: existingResult.guide });
    } catch (flightErr) {
      // If previous failed, continue to retry below
    }
  }

  const billuAiService = require("../services/billuAiService");

  const job = (async () => {
    try {
      return await billuAiService.getOrGenerateStudyGuide({
        ytVideoId,
        videoTitle: videoTitle || "Lecture Notes",
        durationInSeconds: Number(durationInSeconds) || 0,
        channelTitle,
        description,
        customApiKey,
      });
    } finally {
      inFlightGuideJobs.delete(flightKey);
    }
  })();

  inFlightGuideJobs.set(flightKey, job);

  try {
    const result = await job;
    if (result.guide?.fullMarkdownGuide) {
      Video.updateMany(
        { ytVideoId },
        { $set: { notes: result.guide.fullMarkdownGuide } }
      ).catch(() => {});
    }
    res.json({
      success: true,
      fromCache: result.fromCache,
      guide: result.guide,
    });
  } catch (err) {
    console.error("[GenerateGlobalStudyGuide]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/videos/guide/:ytVideoId/module/:moduleIndex
// Generate deep technical manual for a specific module and atomically merge into global cache
exports.generateModuleDeepGuide = async (req, res) => {
  const { ytVideoId, moduleIndex } = req.params;
  const { customApiKey } = req.body || {};

  const flightKey = `mod_${ytVideoId}_${moduleIndex}`;
  if (inFlightGuideJobs.has(flightKey)) {
    try {
      const existingResult = await inFlightGuideJobs.get(flightKey);
      return res.json({ success: true, fromCache: true, ...existingResult });
    } catch {
      // continue
    }
  }

  const billuAiService = require("../services/billuAiService");

  const job = (async () => {
    try {
      return await billuAiService.generateModuleDeepNotes({
        ytVideoId,
        moduleIndex: Number(moduleIndex),
        customApiKey,
      });
    } finally {
      inFlightGuideJobs.delete(flightKey);
    }
  })();

  inFlightGuideJobs.set(flightKey, job);

  try {
    const result = await job;
    if (result.guide?.fullMarkdownGuide) {
      Video.updateMany(
        { ytVideoId },
        { $set: { notes: result.guide.fullMarkdownGuide } }
      ).catch(() => {});
    }
    res.json({
      success: true,
      fromCache: result.fromCache,
      module: result.module,
      guide: result.guide,
    });
  } catch (err) {
    console.error("[GenerateModuleDeepGuide]", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
