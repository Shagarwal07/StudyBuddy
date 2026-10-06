const Video = require("../models/Video");
const Playlist = require("../models/Playlist");
const updateDailyActivity = require("../utils/updateDailyActivity");

exports.updateVideoStatus = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { completed } = req.body;

    if (typeof completed !== "boolean") {
      return res.status(400).json({ success: false, message: "completed must be true or false" });
    }

    const video = req.video || (await Video.findById(videoId));
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const wasCompleted = video.completed;
    video.completed = completed;

    if (completed) {
      const previousWatched = video.watchedSeconds || 0;
      const duration = video.durationInSeconds || 0;
      const unloggedSeconds = Math.max(0, duration - previousWatched);

      video.progressPercent = 100;
      video.watchedSeconds = duration;

      if (!wasCompleted) {
        await updateDailyActivity(req.user.id, unloggedSeconds, true);
      }
    } else {
      video.progressPercent = 0;
      video.watchedSeconds = 0;
    }

    await video.save();
    await Playlist.findByIdAndUpdate(video.playlistId, { lastAccessedAt: new Date() });

    res.status(200).json({ success: true, video });
  } catch (error) {
    console.error("[Video Status]", error.message);
    res.status(500).json({ success: false, message: "Failed to update video status" });
  }
};

exports.updateVideoNotes = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { notes: req.body.notes?.trim() || "" },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    res.status(200).json({ success: true, video });
  } catch (error) {
    console.error("[Video Notes]", error.message);
    res.status(500).json({ success: false, message: "Failed to update notes" });
  }
};

exports.updateVideoProgress = async (req, res) => {
  try {
    const videoId = req.params.id;
    const { watchedSeconds, durationInSeconds } = req.body;

    if (typeof watchedSeconds !== "number" || watchedSeconds < 0) {
      return res.status(400).json({ success: false, message: "Invalid watchedSeconds" });
    }

    const video = req.video || (await Video.findById(videoId));
    if (!video) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const wasCompleted = video.completed;
    const previousWatchedSeconds = video.watchedSeconds || 0;
    let duration = video.durationInSeconds || 0;

    if (typeof durationInSeconds === "number" && durationInSeconds > 0 && duration === 0) {
      duration = Math.floor(durationInSeconds);
      video.durationInSeconds = duration;
    }

    const currentPlaybackPos = duration > 0 ? Math.min(watchedSeconds, duration) : watchedSeconds;
    const secondsDelta = Math.max(0, currentPlaybackPos - previousWatchedSeconds);

    // Keep highest watched checkpoint so seeking back does not regress overall progress
    video.watchedSeconds = Math.max(previousWatchedSeconds, currentPlaybackPos);
    const progressPercent = duration > 0 ? Math.min(100, Math.round((video.watchedSeconds / duration) * 100)) : 0;
    video.progressPercent = progressPercent;

    if (progressPercent >= 95) {
      video.completed = true;
      video.progressPercent = 100;
    }

    const isNowCompleted = !wasCompleted && video.completed;
    if (secondsDelta > 0 || isNowCompleted) {
      await updateDailyActivity(req.user.id, secondsDelta, isNowCompleted);
    }

    await video.save();

    // Only update playlist lastAccessedAt on significant progress steps or completions
    if (isNowCompleted || secondsDelta > 30) {
      await Playlist.findByIdAndUpdate(video.playlistId, { lastAccessedAt: new Date() });
    }

    res.status(200).json({ success: true, video });
  } catch (error) {
    console.error("[Video Progress]", error.message);
    res.status(500).json({ success: false, message: "Failed to update progress" });
  }
};
