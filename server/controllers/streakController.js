const DailyActivity = require("../models/DailyActivity");
const { getLocalDateString } = require("../utils/dateUtils");

const MS_PER_DAY = 86400000;
 
exports.getStreakData = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const activities = await DailyActivity.find({ userId })
      .sort({ date: 1 })
      .lean();

    const heatmap = {};
    let totalMinutesStudied = 0;
    let totalProblemsSolved = 0;

    // Single-pass accumulation (Replaces 3 redundant loops)
    for (const a of activities) {
      const minutes = a.secondsStudied
        ? Math.floor(a.secondsStudied / 60)
        : a.minutesStudied || 0;

      totalMinutesStudied += minutes;
      totalProblemsSolved += a.codingProblemsSolved || 0;

      heatmap[a.date] = {
        videosCompleted: a.videosCompleted || 0,
        minutesStudied: minutes,
        secondsStudied: a.secondsStudied || 0,
        codingProblemsSolved: a.codingProblemsSolved || 0,
      };
    }

    const isDayActive = (dateStr) => {
      const d = heatmap[dateStr];
      return Boolean(
        d &&
          ((d.minutesStudied || 0) > 0 ||
            (d.videosCompleted || 0) > 0 ||
            (d.codingProblemsSolved || 0) > 0)
      );
    };

    // Calculate current streak relative to today/yesterday
    let currentStreak = 0;
    let checkDate = new Date();
    if (!isDayActive(getLocalDateString(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (isDayActive(getLocalDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak directly from already-sorted activities array
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const a of activities) {
      if (!isDayActive(a.date)) continue;
      const curr = new Date(a.date + "T00:00:00Z");
      tempStreak =
        prevDate && Math.round((curr - prevDate) / MS_PER_DAY) === 1
          ? tempStreak + 1
          : 1;
      prevDate = curr;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    res.status(200).json({
      success: true,
      heatmap,
      totalMinutesStudied,
      totalProblemsSolved,
      currentStreak,
      longestStreak,
    });
  } catch (error) {
    console.error("[Streak]", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch streak data",
    });
  }
};
