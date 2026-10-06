const path = require("path");
const fs = require("fs");

const CACHE_PATH = path.resolve(__dirname, "../data/leetcode/leetcode-problem-details.json");
let detailsCache = {};

try {
  detailsCache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
} catch {
  detailsCache = {};
}

/**
 * Returns cached problem details for the bridged roadmap problems (instant in-memory lookup)
 */
function getProblemDetails(titleSlug) {
  if (!titleSlug) return null;
  return detailsCache[String(titleSlug).toLowerCase().trim()] || null;
}

module.exports = {
  getProblemDetails,
};
