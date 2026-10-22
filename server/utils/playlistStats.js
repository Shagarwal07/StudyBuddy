const calculatePlaylistStats = (videos = []) => {
  if (!Array.isArray(videos) || videos.length === 0) {
    return { completedVideos: 0, progress: 0, remainingHours: "0.0" };
  }

  let completedVideos = 0;
  let remainingSeconds = 0;

  for (const video of videos) {
    const duration = Math.max(0, Number(video?.durationInSeconds) || 0);

    if (video?.completed) {
      completedVideos++;
    } else {
      const watched = Math.min(duration, Math.max(0, Number(video?.watchedSeconds) || 0));
      remainingSeconds += duration - watched;
    }
  }

  return {
    completedVideos,
    progress: Math.round((completedVideos / videos.length) * 100),
    remainingHours: (remainingSeconds / 3600).toFixed(1),
  };
};

const enrichPlaylistCard = (playlist, videos = []) => {
  if (!playlist) return null;
  const stats = calculatePlaylistStats(videos);
  const base = typeof playlist.toObject === "function" ? playlist.toObject() : { ...playlist };

  let thumbnailUrl = base.thumbnailUrl;
  if (!thumbnailUrl || String(thumbnailUrl).includes("undefined") || !String(thumbnailUrl).trim()) {
    const firstVideo = videos[0];
    thumbnailUrl =
      firstVideo?.thumbnailUrl ||
      (firstVideo?.ytVideoId ? `https://i.ytimg.com/vi/${firstVideo.ytVideoId}/hqdefault.jpg` : "");
  }

  return {
    ...base,
    thumbnailUrl,
    ...stats,
  };
};

calculatePlaylistStats.calculatePlaylistStats = calculatePlaylistStats;
calculatePlaylistStats.enrichPlaylistCard = enrichPlaylistCard;

module.exports = calculatePlaylistStats;
