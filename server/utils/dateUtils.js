const kolkataFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
});

exports.getLocalDateString = (date = new Date()) => kolkataFormatter.format(date);
