import Prism from "prismjs";
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-c.js";
import "prismjs/components/prism-cpp.js";
import "prismjs/components/prism-java.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-javascript.js";

const escapeHtml = (text) =>
  String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const LANG_MAP = {
  cpp: "cpp",
  "c++": "cpp",
  c: "cpp",
  python: "python",
  py: "python",
  javascript: "javascript",
  js: "javascript",
  node: "javascript",
};

export const highlightCode = (rawCode, lang = "java") => {
  if (!rawCode || typeof rawCode !== "string") return "";
  const key = LANG_MAP[String(lang).toLowerCase().trim()] || "java";
  const grammar = Prism.languages[key] || Prism.languages.clike;

  try {
    if (grammar) return Prism.highlight(rawCode, grammar, key);
  } catch {
    // Fallback to safe HTML escape
  }

  return escapeHtml(rawCode);
};
