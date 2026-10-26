/**
 * urlParser.js
 * High-performance URL regex and domain classification for coding judges
 */

const PLATFORM_DOMAINS = [
  ["leetcode.com", "LeetCode"],
  ["codeforces.com", "Codeforces"],
  ["codechef.com", "CodeChef"],
  ["geeksforgeeks.org", "GeeksforGeeks"],
  ["hackerrank.com", "HackerRank"],
];

const normalize = (str) =>
  String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const detectPlatform = (url = "") => {
  if (!url || typeof url !== "string") return "";
  const match = PLATFORM_DOMAINS.find(([domain]) => url.includes(domain));
  return match ? match[1] : url.startsWith("http") ? "Problem Link" : "";
};

const parseCodeforcesUrl = (url = "") => {
  if (!url || typeof url !== "string" || !url.includes("codeforces.com")) return null;
  const m = url.match(/(?:problemset\/problem|contest|gym)\/(\d+)(?:\/problem)?\/([a-zA-Z0-9]+)/i);
  if (m) {
    return {
      contestId: m[1],
      index: m[2].toUpperCase(),
    };
  }
  return null;
};

const extractTitleFromUrl = (url = "") => {
  if (!url || typeof url !== "string") return "";
  try {
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");
    const parts = cleanUrl.split("/");

    if (url.includes("leetcode.com/problems/")) {
      const idx = parts.indexOf("problems");
      if (idx !== -1 && parts[idx + 1]) {
        return parts[idx + 1]
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    }

    if (url.includes("codeforces.com")) {
      const parsed = parseCodeforcesUrl(url);
      if (parsed) return `CF ${parsed.contestId}${parsed.index}`;
    }

    if (url.includes("geeksforgeeks.org/problems/")) {
      const idx = parts.indexOf("problems");
      if (idx !== -1 && parts[idx + 1]) {
        return parts[idx + 1]
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    }

    const last = parts[parts.length - 1];
    return last ? last.replace(/[-_]/g, " ") : "";
  } catch {
    return "";
  }
};

const isPracticeJudgeUrl = (url = "") => {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("leetcode.com") ||
    url.includes("codeforces.com") ||
    url.includes("geeksforgeeks.org") ||
    url.includes("codechef.com") ||
    url.includes("hackerrank.com")
  );
};

const isInstructorResourceUrl = (url = "") => {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("takeuforward.org") ||
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("github.com")
  );
};

const cleanProblemTitle = (title = "") => {
  if (!title || typeof title !== "string") return "";
  return title
    .replace(/^[\d\s.\-_]+/, "")
    .replace(/\s+/g, " ")
    .trim();
};

module.exports = {
  PLATFORM_DOMAINS,
  normalize,
  detectPlatform,
  parseCodeforcesUrl,
  extractTitleFromUrl,
  isPracticeJudgeUrl,
  isInstructorResourceUrl,
  cleanProblemTitle,
};
