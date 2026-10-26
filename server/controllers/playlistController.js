const Playlist = require("../models/Playlist");
const Video = require("../models/Video");
const Note = require("../models/Note");
const AiVideoStudyGuide = require("../models/AiVideoStudyGuide");
const ytService = require("../services/youtubeService");
const { enrichPlaylistCard } = require("../utils/playlistStats");

const getSnippetThumbnail = (snippet = {}, vId = "") =>
  snippet.thumbnails?.high?.url ||
  snippet.thumbnails?.medium?.url ||
  snippet.thumbnails?.default?.url ||
  (vId ? `https://i.ytimg.com/vi/${vId}/hqdefault.jpg` : "");

const createSingleVideoPlaylist = async (userId, videoId, res) => {
  const videoKey = `video_${videoId}`;
  const existing = await Playlist.findOne({ userId, ytPlaylistId: videoKey });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "You are already tracking this video!",
    });
  }

  const videoData = await ytService.fetchSingleVideoMetadata(videoId);

  const singlePlaylist = new Playlist({
    userId,
    ytPlaylistId: videoKey,
    title: videoData.title,
    description: videoData.description || `Single video by ${videoData.channelTitle || "YouTube"}`,
    thumbnailUrl: videoData.thumbnailUrl,
    totalVideos: 1,
  });
  const savedPlaylist = await singlePlaylist.save();

  const videoDoc = new Video({
    playlistId: savedPlaylist._id,
    ytVideoId: videoId,
    title: videoData.title,
    description: videoData.description || "",
    thumbnailUrl: videoData.thumbnailUrl,
    durationInSeconds: videoData.durationInSeconds || 0,
    position: 0,
    watchedSeconds: 0,
    progressPercent: 0,
    completed: false,
    notes: "",
  });
  await videoDoc.save();

  return res.status(201).json({
    success: true,
    message: "Video imported successfully!",
    playlist: savedPlaylist,
  });
};

exports.syncPlaylist = async (req, res) => {
  try {
    const { playlistUrl } = req.body;
    const userId = req.user.id;

    if (playlistUrl && typeof playlistUrl === "string") {
      if (playlistUrl.includes("/shorts/")) {
        return res.status(400).json({
          success: false,
          message: "YouTube Shorts are not supported. Please provide a standard YouTube video or playlist link.",
        });
      }
      if (playlistUrl.includes("/live/")) {
        return res.status(400).json({
          success: false,
          message: "YouTube Live streams are not supported. Please provide a standard YouTube video or playlist link.",
        });
      }
    }

    const playlistId = ytService.extractPlaylistId(playlistUrl);
    const videoId = ytService.extractVideoId(playlistUrl);

    if (!playlistId && !videoId) {
      return res.status(400).json({
        success: false,
        message: "Invalid YouTube URL. Please provide a valid playlist or video link.",
      });
    }

    const trackedPlaylistsCount = await Playlist.countDocuments({ userId });
    if (trackedPlaylistsCount >= 20) {
      return res.status(400).json({
        success: false,
        message: "Limit reached! You can track up to 20 courses or playlists simultaneously.",
      });
    }

    // 1. Single Video Import (when no playlist ID is present)
    if (!playlistId && videoId) {
      return createSingleVideoPlaylist(userId, videoId, res);
    }

    // 2. Playlist Import (with fallback to single video if playlist is not found or fails)
    let playlist = await Playlist.findOne({ userId, ytPlaylistId: playlistId });
    if (playlist) {
      return res.status(400).json({
        success: false,
        message: "You are already tracking this playlist!",
      });
    }

    let snippet;
    try {
      snippet = await ytService.fetchPlaylistMetadata(playlistId);
    } catch (err) {
      if (videoId && (err.message === "PLAYLIST_NOT_FOUND" || err.message?.includes("not found"))) {
        return createSingleVideoPlaylist(userId, videoId, res);
      }
      if (err.message === "PLAYLIST_NOT_FOUND" || err.message?.includes("not found")) {
        return res.status(404).json({ success: false, message: "Playlist not found on YouTube" });
      }
      if (err.message === "YOUTUBE_QUOTA_EXCEEDED") {
        return res.status(429).json({ success: false, message: "YouTube API quota exceeded. Please try again later." });
      }
      if (err.message === "YOUTUBE_KEY_INVALID") {
        return res.status(400).json({ success: false, message: "Invalid YouTube API key configuration." });
      }
      throw err;
    }

    const videosArray = await ytService.fetchAllPlaylistVideos(playlistId);
    const videoIds = videosArray
      .map((video) => video.snippet.resourceId?.videoId)
      .filter(Boolean);

    const durationData = await ytService.fetchVideoDurations(videoIds);
    const durationMap = new Map(durationData.map((item) => [item.id, item]));

    const firstVidId = videosArray[0]?.snippet?.resourceId?.videoId;
    const fallbackThumb = firstVidId ? `https://i.ytimg.com/vi/${firstVidId}/hqdefault.jpg` : "";

    const calculatedThumbnail =
      snippet.thumbnailUrl ||
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.default?.url ||
      fallbackThumb;

    playlist = new Playlist({
      userId,
      ytPlaylistId: playlistId,
      title: snippet.title,
      description: snippet.description,
      thumbnailUrl: calculatedThumbnail,
      totalVideos: videosArray.length,
    });
    const savedPlaylist = await playlist.save();

    const videoDocs = videosArray
      .map((video, idx) => {
        const videoSnippet = video.snippet || {};
        const vId = videoSnippet.resourceId?.videoId;
        const durationInfo = durationMap.get(vId);

        const durationInSeconds = durationInfo
          ? ytService.convertDurationToSeconds(durationInfo.contentDetails?.duration)
          : (video.durationInSeconds || 0);

        return {
          playlistId: savedPlaylist._id,
          ytVideoId: vId,
          title: videoSnippet.title || `Video ${idx + 1}`,
          description: videoSnippet.description || "",
          thumbnailUrl: getSnippetThumbnail(videoSnippet, vId),
          position: Number.isFinite(videoSnippet.position) ? videoSnippet.position : idx,
          notes: "",
          durationInSeconds,
          completed: false,
          progressPercent: 0,
          watchedSeconds: 0,
        };
      })
      .filter((v) => v.ytVideoId);

    if (videoDocs.length > 0) {
      await Video.insertMany(videoDocs);
    }

    res.status(201).json({
      success: true,
      message: "Playlist synced successfully!",
      playlist: savedPlaylist,
    });
  } catch (error) {
    if (error.message === "VIDEO_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Video not found on YouTube" });
    }
    if (error.message === "PLAYLIST_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Playlist not found on YouTube" });
    }
    if (error.message === "YOUTUBE_QUOTA_EXCEEDED") {
      return res.status(429).json({ success: false, message: "YouTube API quota exceeded. Please try again later." });
    }
    if (error.message === "YOUTUBE_KEY_INVALID") {
      return res.status(400).json({ success: false, message: "Invalid YouTube API key configuration." });
    }
    console.error("[Playlist Sync]", error.message);
    res.status(500).json({ success: false, message: "Server Error during synchronization" });
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    const playlist =
      req.playlist ||
      (await Playlist.findOne({ _id: req.params.id, userId: req.user.id }));

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found or unauthorized",
      });
    }

    const playlistId = playlist._id;

    await Promise.all([
      Video.deleteMany({ playlistId }),
      Playlist.findByIdAndDelete(playlistId),
      Note.deleteMany({ playlistId }),
    ]);

    res.status(200).json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    console.error("[Playlist Delete]", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete playlist",
    });
  }
};

exports.resyncPlaylist = async (req, res) => {
  try {
    const playlist =
      req.playlist ||
      (await Playlist.findOne({ _id: req.params.id, userId: req.user.id }));

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found or unauthorized",
      });
    }

    if (playlist.ytPlaylistId?.startsWith("video_")) {
      return res.status(200).json({
        success: true,
        addedVideos: 0,
        totalVideos: 1,
        message: "Single video is up to date",
      });
    }

    const latestVideos = await ytService.fetchAllPlaylistVideos(playlist.ytPlaylistId);
    const existingVideos = await Video.find({ playlistId: playlist._id }, "ytVideoId");
    const existingVideoIds = new Set(existingVideos.map((video) => video.ytVideoId));

    const newVideos = latestVideos.filter((video) => {
      const ytVideoId = video.snippet.resourceId?.videoId;
      return ytVideoId && !existingVideoIds.has(ytVideoId);
    });

    const newVideoIds = newVideos
      .map((video) => video.snippet.resourceId?.videoId)
      .filter(Boolean);

    const durationData =
      newVideoIds.length > 0 ? await ytService.fetchVideoDurations(newVideoIds) : [];

    const durationMap = new Map(durationData.map((item) => [item.id, item]));

    const newVideoDocs = newVideos.map((video, idx) => {
      const videoSnippet = video.snippet || {};
      const vId = videoSnippet.resourceId?.videoId;
      const durationInfo = durationMap.get(vId);

      const durationInSeconds = durationInfo
        ? ytService.convertDurationToSeconds(durationInfo.contentDetails?.duration)
        : 0;

      return {
        playlistId: playlist._id,
        ytVideoId: vId,
        title: videoSnippet.title,
        description: videoSnippet.description || "",
        thumbnailUrl: getSnippetThumbnail(videoSnippet, vId),
        position: Number.isFinite(videoSnippet.position) ? videoSnippet.position : idx,
        completed: false,
        progressPercent: 0,
        watchedSeconds: 0,
        notes: "",
        durationInSeconds,
      };
    });

    if (newVideoDocs.length > 0) {
      await Video.insertMany(newVideoDocs);
      playlist.totalVideos += newVideoDocs.length;
      await playlist.save();
    }

    return res.status(200).json({
      success: true,
      addedVideos: newVideoDocs.length,
      totalVideos: playlist.totalVideos,
    });
  } catch (error) {
    console.error("[Playlist Resync]", error.message);
    res.status(500).json({
      success: false,
      message: "Resync failed",
    });
  }
};

exports.getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user.id;
    const playlistsRaw = await Playlist.find({ userId }).sort({ createdAt: -1 }).lean();

    if (playlistsRaw.length === 0) {
      return res.status(200).json({ success: true, playlists: [] });
    }

    const playlistIds = playlistsRaw.map((p) => p._id);
    const allVideos = await Video.find({ playlistId: { $in: playlistIds } })
      .select("playlistId durationInSeconds watchedSeconds completed thumbnailUrl ytVideoId position")
      .sort({ position: 1 })
      .lean();

    const videosByPlaylist = {};
    for (const v of allVideos) {
      const pid = String(v.playlistId);
      if (!videosByPlaylist[pid]) videosByPlaylist[pid] = [];
      videosByPlaylist[pid].push(v);
    }

    const playlists = playlistsRaw.map((playlist) =>
      enrichPlaylistCard(playlist, videosByPlaylist[String(playlist._id)] || [])
    );

    res.status(200).json({
      success: true,
      playlists,
    });
  } catch (error) {
    console.error("[Playlist]", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch playlists",
    });
  }
};

exports.getPlaylistDetails = async (req, res) => {
  try {
    const playlist =
      req.playlist ||
      (await Playlist.findOne({
        _id: req.params.id,
        userId: req.user.id,
      }));

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }

    const videosRaw = await Video.find({
      playlistId: playlist._id,
    })
      .sort({ position: 1 })
      .lean();

    const ytVideoIds = videosRaw.map((v) => v.ytVideoId).filter(Boolean);
    const existingGuides = await AiVideoStudyGuide.find(
      { ytVideoId: { $in: ytVideoIds } },
      "ytVideoId"
    ).lean();

    const guideSet = new Set(existingGuides.map((g) => g.ytVideoId));

    const videos = videosRaw.map((v) => ({
      ...v,
      hasStudyGuide: guideSet.has(v.ytVideoId),
    }));

    res.status(200).json({
      success: true,
      playlist,
      videos,
    });
  } catch (error) {
    console.error("[Playlist Details]", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch playlist details",
    });
  }
};
