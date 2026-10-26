const SHEET_PARSER_PROMPT_VERSION = "v1";

const SHEET_SCAN_PROMPT = `You are an expert programming contest and technical interview curriculum scanner.
Analyze this document, image, or syllabus sheet and extract ALL coding, DSA, and programming problems.

CRITICAL INSTRUCTIONS FOR PROBLEM TITLES AND LINKS:
1. "number": The problem number or serial index if present (e.g. "1", "4A", "142"), or null.
2. "title": Extract the clean, core problem title. ALWAYS STRIP:
   - Prefixes like "Q1.", "Question 1:", "Problem 1 -", "Day 4:", "#101", "LC 56.", etc.
   - Suffixes like "(Easy)", "[Medium]", "(Hard)", "- LeetCode", "[Arrays]", etc.
   Example: "Q1. Two Sum (Easy)" -> "Two Sum"
   Example: "Day 3 - Merge Intervals [LC 56]" -> "Merge Intervals"
3. "platform": "LeetCode", "Codeforces", "CodeChef", "GeeksforGeeks", "HackerRank", "takeUforward", or null.
4. "questionUrl": The practice problem URL where the student solves the question (e.g. leetcode.com/problems/..., geeksforgeeks.org/..., codeforces.com/..., takeuforward.org/...). If a link points to an online judge or practice question, put it here.
5. "solutionUrl": The instructor's solution, video, editorial, or notes URL (e.g. Google Drive, YouTube, GitHub, Notion, Loom, or personal blog created by the instructor). If a link points to an answer, code, video, or drive, put it here.
6. "url": If only one URL is provided and you cannot determine whether it is question or solution, put it in "url".
7. "difficulty": "Easy", "Medium", "Hard", or null.
8. "topic": The standard interview pattern module (e.g. "Math & Fundamentals", "Arrays & Hashing", "Two Pointers & Sliding Window", "Prefix Sum", "Binary Search", "Strings", "Linked Lists", "Stack & Queue", "Trees & BST", "Graphs", "Dynamic Programming", "Heaps & Greedy", or "Bit Manipulation"), or null.

Return ONLY a valid JSON array of objects with the exact keys:
[
  {
    "number": "1",
    "title": "Two Sum",
    "platform": "LeetCode",
    "questionUrl": "https://leetcode.com/problems/two-sum/",
    "solutionUrl": "https://drive.google.com/file/d/...",
    "url": null,
    "difficulty": "Easy",
    "topic": "Arrays"
  }
]`;

const MIME_MAP = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Builds parts payload for Gemini document or sheet scanning
 */
function buildSheetScanParts({ fileBase64, mimeType = "application/pdf", fileName = "", rawText = "" }) {
  const parts = [{ text: SHEET_SCAN_PROMPT }];

  if (rawText?.trim()) {
    parts.push({ text: `Document Content:\n${rawText.trim()}` });
  }

  if (fileBase64) {
    const cleanBase64 = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
    const ext = (fileName.split(".").pop() || "").toLowerCase();
    const isText = /text|csv|json|md|txt/.test(`${mimeType} ${ext}`);

    if (isText) {
      try {
        const decoded = Buffer.from(cleanBase64, "base64").toString("utf8");
        parts.push({ text: `Document Content (${fileName || "uploaded file"}):\n${decoded}` });
      } catch {
        parts.push({ inline_data: { mime_type: "text/plain", data: cleanBase64 } });
      }
    } else {
      const finalMime = MIME_MAP[ext] || mimeType || "application/pdf";
      parts.push({ inline_data: { mime_type: finalMime, data: cleanBase64 } });
    }
  }

  return parts;
}

/**
 * Builds prompt for categorizing problems into standard DSA curriculum modules
 */
function buildCategorizePrompt(batchProblems) {
  return `You are an expert DSA curriculum architect (like Striver, NeetCode, or LeetCode Explore).
Organize the following coding interview problems into standardized, pedagogical topic modules based on their problem titles and algorithmic patterns.
Standard modules include:
- "Arrays & Hashing"
- "Two Pointers & Sliding Window"
- "Prefix Sum"
- "Binary Search"
- "Strings & Pattern Matching"
- "Linked Lists"
- "Stack & Queue"
- "Trees & BST"
- "Graphs & Disjoint Set"
- "Dynamic Programming"
- "Heaps & Greedy"
- "Bit Manipulation"
- "Math & Number Theory"
- "Backtracking & Recursion"

Input problems:
${JSON.stringify(batchProblems.map((b) => ({ id: b.id, title: b.title })))}

Return ONLY a valid JSON array of objects with the exact schema:
[
  { "id": <same id>, "module": "<Module Name>" }
]`;
}

module.exports = {
  SHEET_PARSER_PROMPT_VERSION,
  SHEET_SCAN_PROMPT,
  MIME_MAP,
  buildSheetScanParts,
  buildCategorizePrompt,
};
