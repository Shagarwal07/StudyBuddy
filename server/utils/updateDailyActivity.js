const DailyActivity = require("../models/DailyActivity");
const { getLocalDateString } = require("./dateUtils");

module.exports = async (userId, secondsWatched = 0, isCompletion = false) => {
  const validSeconds = Math.max(0, Math.floor(Number(secondsWatched) || 0));
  if (validSeconds === 0 && !isCompletion) return;

  const inc = {};
  if (validSeconds > 0) inc.secondsStudied = validSeconds;
  if (isCompletion) inc.videosCompleted = 1;

  const doc = await DailyActivity.findOneAndUpdate(
    { userId, date: getLocalDateString() },
    { $inc: inc },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (doc && validSeconds > 0) {
    const accurateMinutes = Math.floor((doc.secondsStudied || 0) / 60);
    if (doc.minutesStudied !== accurateMinutes) {
      await DailyActivity.updateOne({ _id: doc._id }, { $set: { minutesStudied: accurateMinutes } });
    }
  }

  return doc;
};
