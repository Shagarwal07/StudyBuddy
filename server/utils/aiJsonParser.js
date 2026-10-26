/**
 * Bulletproof JSON Parser for LLM Responses.
 * Handles:
 * 1. Markdown code fences (```json ... ```)
 * 2. Unescaped control characters (literal newlines/tabs inside string literals)
 * 3. Truncated / Unterminated JSON strings and structures (auto-closing open quotes/brackets)
 * 4. Fallback regex extraction for roadmap items and markdown content
 */

function cleanCodeFences(raw = "") {
  let text = String(raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  return text;
}

/**
 * Escapes raw control characters (ASCII 0x00 - 0x1F) only inside JSON string literals.
 */
function sanitizeControlCharacters(jsonString = "") {
  let inString = false;
  let isEscaped = false;
  let out = "";

  for (let i = 0; i < jsonString.length; i++) {
    const ch = jsonString[i];
    const code = jsonString.charCodeAt(i);

    if (inString) {
      if (isEscaped) {
        out += ch;
        isEscaped = false;
      } else if (ch === "\\") {
        out += ch;
        isEscaped = true;
      } else if (ch === '"') {
        out += ch;
        inString = false;
      } else if (code === 10) {
        // literal newline -> escape to \n
        out += "\\n";
      } else if (code === 13) {
        // literal carriage return -> escape to \r
        out += "\\r";
      } else if (code === 9) {
        // literal tab -> escape to \t
        out += "\\t";
      } else if (code < 32) {
        // other control characters -> skip
      } else {
        out += ch;
      }
    } else {
      if (ch === '"') {
        inString = true;
      }
      out += ch;
    }
  }

  return out;
}

/**
 * Attempts to repair truncated JSON by closing open quotes and matching brackets.
 */
function attemptRepairTruncatedJson(jsonString = "") {
  let str = jsonString.trim();
  let inString = false;
  let isEscaped = false;
  const stack = [];

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === "\\") {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === "{" || ch === "[") {
        stack.push(ch);
      } else if (ch === "}" && stack[stack.length - 1] === "{") {
        stack.pop();
      } else if (ch === "]" && stack[stack.length - 1] === "[") {
        stack.pop();
      }
    }
  }

  // If left inside a string, close it
  if (inString) {
    str += '"';
  }

  // Strip trailing commas before closing
  str = str.replace(/,\s*$/, "");

  // Close remaining open brackets in reverse
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === "{") str += "}";
    if (open === "[") str += "]";
  }

  return str;
}

/**
 * Main safe parser function
 */
function safeParseAiJson(rawText, fallback = {}) {
  if (!rawText) return fallback;

  const cleaned = cleanCodeFences(rawText);

  // 1. Direct parse attempt
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // 2. Try sanitizing unescaped control characters in string literals
    try {
      const sanitized = sanitizeControlCharacters(cleaned);
      return JSON.parse(sanitized);
    } catch (err2) {
      // 3. Try repairing truncated/unterminated JSON
      try {
        const repaired = attemptRepairTruncatedJson(sanitizeControlCharacters(cleaned));
        return JSON.parse(repaired);
      } catch (err3) {
        console.warn(
          "[AiJsonParser] JSON.parse recovery failed:",
          err1.message,
          "| Repaired error:",
          err3.message
        );
      }
    }
  }

  // 4. Return fallback if all recovery failed
  return fallback;
}

/**
 * Robust chapter notes parser that gracefully handles:
 * 1. Pure markdown returned by the model
 * 2. JSON responses with escaped markdownContent
 * 3. Malformed JSON with unescaped quotes in markdown code blocks
 */
function parseChapterNotesResponse(rawText, fallbackOverview = "") {
  if (!rawText || !String(rawText).trim()) {
    return {
      markdownContent: fallbackOverview ? `## Overview\n${fallbackOverview}` : "",
      keyInsights: [],
    };
  }

  const cleaned = cleanCodeFences(rawText).trim();

  // Case A: JSON format
  if (cleaned.startsWith("{")) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.markdownContent) {
        return {
          markdownContent: String(parsed.markdownContent).trim(),
          keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
        };
      }
    } catch {
      // JSON.parse failed - try control char sanitization
      try {
        const sanitized = sanitizeControlCharacters(cleaned);
        const parsed = JSON.parse(sanitized);
        if (parsed.markdownContent) {
          return {
            markdownContent: String(parsed.markdownContent).trim(),
            keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
          };
        }
      } catch {
        // Regex recovery: extract content inside "markdownContent"
        const mdMatch =
          cleaned.match(/"markdownContent"\s*:\s*"([\s\S]*?)"\s*,\s*"keyInsights"/i) ||
          cleaned.match(/"markdownContent"\s*:\s*"([\s\S]*?)"\s*}/i);

        if (mdMatch && mdMatch[1]) {
          const unescapedMd = mdMatch[1]
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\t/g, "\t")
            .replace(/\\\\/g, "\\");

          const insightsMatch = cleaned.match(/"keyInsights"\s*:\s*\[([\s\S]*?)\]/i);
          const insights = [];
          if (insightsMatch && insightsMatch[1]) {
            const itemMatches = insightsMatch[1].matchAll(/"([^"]+)"/g);
            for (const m of itemMatches) {
              if (m[1]?.trim()) insights.push(m[1].trim());
            }
          }
          return {
            markdownContent: unescapedMd.trim(),
            keyInsights: insights,
          };
        }
      }
    }
  }

  // Case B: Pure Markdown format
  let markdown = cleaned;
  const insights = [];

  // Extract ### Key Insights / ### Key Takeaways if present
  const insightSectionRegex = /(?:###?)\s*Key\s*(?:Insights|Takeaways)[\s\S]*$/i;
  const sectionMatch = markdown.match(insightSectionRegex);
  if (sectionMatch) {
    const lines = sectionMatch[0].split("\n");
    for (const line of lines) {
      const bulletMatch = line.match(/^\s*[-*]\s*(.+)$/);
      if (bulletMatch && bulletMatch[1]?.trim()) {
        insights.push(bulletMatch[1].trim());
      }
    }
    markdown = markdown.replace(insightSectionRegex, "").trim();
  }

  return {
    markdownContent: markdown || (fallbackOverview ? `## Overview\n${fallbackOverview}` : ""),
    keyInsights: insights,
  };
}

module.exports = {
  safeParseAiJson,
  parseChapterNotesResponse,
  cleanCodeFences,
  sanitizeControlCharacters,
  attemptRepairTruncatedJson,
};
