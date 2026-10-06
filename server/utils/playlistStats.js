module.exports = (videos = []) => {
  let completedVideos = 0;
  let totalSeconds = 0;
  let watchedSeconds = 0;

  for (const video of videos) {
    if (video.completed) completedVideos++;
    totalSeconds += video.durationInSeconds || 0;
    watchedSeconds += video.watchedSeconds || 0;
  }

  const total = videos.length;
  return {
    completedVideos,
    progress: total === 0 ? 0 : Math.round((completedVideos / total) * 100),
    remainingHours: (Math.max(0, totalSeconds - watchedSeconds) / 3600).toFixed(1),
  };
};
