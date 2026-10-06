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
      { new: true, runValidators: true }
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
