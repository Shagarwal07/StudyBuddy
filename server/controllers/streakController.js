const DailyActivity = require("../models/DailyActivity");
const UserCodingProgress = require("../models/UserCodingProgress");
const { getLocalDateString } = require("../utils/dateUtils");

const MS_PER_DAY = 86400000;
 
exports.getStreakData = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const [activities, codingProgress] = await Promise.all([
      DailyActivity.find({ userId }).sort({ date: 1 }).lean(),
      UserCodingProgress.findOne({ userId }).select("solvedProblemKeys").lean(),
    ]);

    const heatmap = {};
    let totalMinutesStudied = 0;
    let accumulatedDailyProblems = 0;

    const uniqueSolvedCount = codingProgress?.solvedProblemKeys?.length;

    // Single-pass accumulation (Replaces 3 redundant loops)
    for (const a of activities) {
      const minutes = a.secondsStudied
        ? Math.floor(a.secondsStudied / 60)
        : a.minutesStudied || 0;

      totalMinutesStudied += minutes;
      accumulatedDailyProblems += a.codingProblemsSolved || 0;

      const clampedProblems = typeof uniqueSolvedCount === "number"
        ? Math.min(a.codingProblemsSolved || 0, uniqueSolvedCount)
        : a.codingProblemsSolved || 0;

      heatmap[a.date] = {
        videosCompleted: a.videosCompleted || 0,
        minutesStudied: minutes,
        secondsStudied: a.secondsStudied || 0,
        codingProblemsSolved: clampedProblems,
      };
    }

    const totalProblemsSolved = typeof uniqueSolvedCount === "number"
      ? uniqueSolvedCount
      : accumulatedDailyProblems;

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
