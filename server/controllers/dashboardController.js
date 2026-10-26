const Playlist = require("../models/Playlist");
const Video = require("../models/Video");
const { calculatePlaylistStats, enrichPlaylistCard } = require("../utils/playlistStats");

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const userPlaylists = await Playlist.find({ userId }).sort({ createdAt: -1 }).lean();
    const totalPlaylists = userPlaylists.length;

    if (totalPlaylists === 0) {
      return res.status(200).json({
        success: true,
        stats: { totalPlaylists: 0, completedVideos: 0 },
        recentPlaylists: [],
      });
    }

    const recentPlaylistsRaw = userPlaylists.slice(0, 4);
    const recentPlaylistIds = recentPlaylistsRaw.map((p) => p._id);
    const allPlaylistIds = userPlaylists.map((p) => p._id);

    // Fetch only videos for the 4 recent playlists + fast index count for total completed
    const [recentVideos, completedVideos] = await Promise.all([
      Video.find({ playlistId: { $in: recentPlaylistIds } })
        .select("playlistId completed watchedSeconds durationInSeconds thumbnailUrl ytVideoId")
        .lean(),
      Video.countDocuments({ playlistId: { $in: allPlaylistIds }, completed: true }),
    ]);

    const videosByPlaylist = {};
    for (const v of recentVideos) {
      const pid = String(v.playlistId);
      if (!videosByPlaylist[pid]) videosByPlaylist[pid] = [];
      videosByPlaylist[pid].push(v);
    }

    const recentPlaylists = recentPlaylistsRaw.map((playlist) =>
      enrichPlaylistCard(playlist, videosByPlaylist[String(playlist._id)] || [])
    );

    res.status(200).json({
      success: true,
      stats: {
        totalPlaylists,
        completedVideos,
      },
      recentPlaylists,
    });
  } catch (error) {
    console.error("[Dashboard]", error.message);

    res.status(500).json({
      success: false,
      message: "Dashboard fetch failed",
    });
  }
};

exports.getContinueLearning = async (req, res) => {
  try {
    const userId = req.user.id;

    const playlist = await Playlist.findOne({ userId }).sort({
      lastAccessedAt: -1,
    });

    if (!playlist) {
      return res.status(200).json({
        success: true,
        playlist: null,
        video: null,
      });
    }

    const playlistVideos = await Video.find({ playlistId: playlist._id })
      .sort({ position: 1 })
      .select("title position completed watchedSeconds durationInSeconds thumbnailUrl ytVideoId progressPercent")
      .lean();

    // 1. Resume partially watched video first
    let video = playlistVideos.find(
      (v) => !v.completed && ((v.progressPercent || 0) > 0 || (v.watchedSeconds || 0) > 0)
    );

    // 2. Otherwise first uncompleted video
    if (!video) {
      video = playlistVideos.find((v) => !v.completed);
    }

    // Everything completed
    if (!video) {
      return res.status(200).json({
        success: true,
        playlist: null,
        video: null,
      });
    }

    let playlistThumb = playlist.thumbnailUrl;
    let vidThumb = video.thumbnailUrl;

    if (!playlistThumb || playlistThumb.includes("undefined")) {
      playlistThumb = vidThumb || `https://i.ytimg.com/vi/${video.ytVideoId}/hqdefault.jpg`;
    }
    if (!vidThumb || vidThumb.includes("undefined")) {
      vidThumb = `https://i.ytimg.com/vi/${video.ytVideoId}/hqdefault.jpg`;
    }

    const stats = calculatePlaylistStats(playlistVideos);
    const totalVideos = playlist.totalVideos || playlistVideos.length;

    res.status(200).json({
      success: true,
      playlist: {
        _id: playlist._id,
        title: playlist.title,
        thumbnailUrl: playlistThumb,
        totalVideos,
        completedVideos: stats.completedVideos,
        progress: stats.progress,
        remainingHours: stats.remainingHours,
      },
      video: {
        _id: video._id,
        title: video.title,
        thumbnailUrl: vidThumb,
        watchedSeconds: video.watchedSeconds,
        progressPercent: video.progressPercent,
        durationInSeconds: video.durationInSeconds || 0,
        position: video.position ?? 0,
      },
    });
  } catch (error) {
    console.error("[Dashboard]", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch continue learning",
    });
  }
};
