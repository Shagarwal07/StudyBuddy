const Playlist = require("../models/Playlist");
const Video = require("../models/Video");

// 1. Guard Playlist Routes (GET/DELETE/POST /api/playlists/:id)
const verifyPlaylistOwnership = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this playlist.",
      });
    }

    req.playlist = playlist;
    next();
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }
    console.error("[Playlist Ownership]", error.message);
    res.status(500).json({ success: false, message: "Ownership check failed" });
  }
};

// 2. Guard Video Routes (PATCH /api/videos/:id) — Single 1-hop populated query
const verifyVideoOwnership = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate("playlistId", "userId");

    if (!video || !video.playlistId) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    if (video.playlistId.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this video.",
      });
    }

    req.video = video;
    req.playlist = video.playlistId;
    next();
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    console.error("[Video Ownership]", error.message);
    res.status(500).json({ success: false, message: "Ownership check failed" });
  }
};

module.exports = {
  verifyPlaylistOwnership,
  verifyVideoOwnership,
};

