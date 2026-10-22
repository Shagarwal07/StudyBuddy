const DailyActivity = require("../models/DailyActivity");
const { getLocalDateString } = require("./dateUtils");

module.exports = async (userId, secondsWatched = 0, isCompletion = false) => {
  if (!userId) return null;

  const validSeconds = Math.max(0, Math.floor(Number(secondsWatched) || 0));
  if (validSeconds === 0 && !isCompletion) return null;

  const inc = {};
  if (validSeconds > 0) inc.secondsStudied = validSeconds;
  if (isCompletion) inc.videosCompleted = 1;

  const date = getLocalDateString();

  const doc = await DailyActivity.findOneAndUpdate(
    { userId, date },
    { $inc: inc },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (doc) {
    const accurateMinutes = Math.floor((doc.secondsStudied || 0) / 60);
    if (doc.minutesStudied !== accurateMinutes) {
      doc.minutesStudied = accurateMinutes;
      DailyActivity.updateOne({ _id: doc._id }, { $set: { minutesStudied: accurateMinutes } }).catch(() => {});
    }
  }

  return doc;
};
