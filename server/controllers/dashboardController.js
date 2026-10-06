const Playlist = require("../models/Playlist");
const Video = require("../models/Video");
const User = require("../models/User");
const calculatePlaylistStats = require("../utils/playlistStats");

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Parallelize user lookup and playlists in 1 round-trip
    const [user, userPlaylists] = await Promise.all([
      User.findById(userId).select("username email").lean(),
      Playlist.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const totalPlaylists = userPlaylists.length;
    const recentPlaylistsRaw = userPlaylists.slice(0, 4);
    const allPlaylistIds = userPlaylists.map((p) => p._id);

    // Fetch all user videos in 1 single query instead of 4 separate queries
    const allVideos = await Video.find({ playlistId: { $in: allPlaylistIds } })
      .select("playlistId position completed watchedSeconds durationInSeconds thumbnailUrl ytVideoId title")
      .lean();

    const videosByPlaylist = {};
    let completedVideos = 0;
    let totalWatchedSeconds = 0;

    for (const v of allVideos) {
      const pid = String(v.playlistId);
      if (!videosByPlaylist[pid]) videosByPlaylist[pid] = [];
      videosByPlaylist[pid].push(v);
      if (v.completed) completedVideos++;
      totalWatchedSeconds += v.watchedSeconds || 0;
    }

    const totalVideos = allVideos.length;
    const videoProgress = totalVideos === 0 ? 0 : Math.round((completedVideos / totalVideos) * 100);
    const totalWatchedHours = (totalWatchedSeconds / 3600).toFixed(1);

    const recentPlaylists = recentPlaylistsRaw.map((playlist) => {
      const videos = videosByPlaylist[String(playlist._id)] || [];
      const stats = calculatePlaylistStats(videos);
      let thumbnailUrl = playlist.thumbnailUrl;
      if (!thumbnailUrl || thumbnailUrl.includes("undefined") || !thumbnailUrl.trim()) {
        const firstVideo = videos[0];
        thumbnailUrl = firstVideo?.thumbnailUrl || (firstVideo?.ytVideoId ? `https://i.ytimg.com/vi/${firstVideo.ytVideoId}/hqdefault.jpg` : "");
      }
      return {
        ...playlist,
        thumbnailUrl,
        ...stats,
      };
    });

    res.status(200).json({
      success: true,
      user: {
        username: user?.username || "Learner",
        email: user?.email || "",
      },
      stats: {
        totalPlaylists,
        totalVideos,
        completedVideos,
        videoProgress,
        totalWatchedSeconds,
        totalWatchedHours,
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

    // Resume partially watched video first
    let video = await Video.findOne({
      playlistId: playlist._id,
      completed: false,
      progressPercent: { $gt: 0 },
    }).sort({
      position: 1,
    });

    // Otherwise first uncompleted video
    if (!video) {
      video = await Video.findOne({
        playlistId: playlist._id,
        completed: false,
      }).sort({
        position: 1,
      });
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

    res.status(200).json({
      success: true,
      playlist: {
        _id: playlist._id,
        title: playlist.title,
        thumbnailUrl: playlistThumb,
      },
      video: {
        _id: video._id,
        title: video.title,
        thumbnailUrl: vidThumb,
        watchedSeconds: video.watchedSeconds,
        progressPercent: video.progressPercent,
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
