const Video = require("../models/Video");
const Playlist = require("../models/Playlist");

const verifyVideoOwnership = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const playlist = await Playlist.findById(video.playlistId).select("userId");

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    if (playlist.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this video.",
      });
    }

    req.video = video;
    req.playlist = playlist;
    next();
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Video not found" });
    }
    console.error("[Video Ownership]", error.message);

    res.status(500).json({
      success: false,
      message: "Ownership check failed",
    });
  }
};

module.exports = verifyVideoOwnership;
