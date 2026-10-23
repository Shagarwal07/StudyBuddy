import Prism from "prismjs";
import "prismjs/components/prism-clike.js";
import "prismjs/components/prism-c.js";
import "prismjs/components/prism-cpp.js";
import "prismjs/components/prism-java.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-javascript.js";

const escapeHtml = (text) => {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const highlightCode = (rawCode, lang = "java") => {
  if (!rawCode || typeof rawCode !== "string") return "";
  const normalizedLang = String(lang || "java").toLowerCase().trim();

  let grammar = Prism.languages.java;
  let prismLang = "java";

  if (normalizedLang === "cpp" || normalizedLang === "c++" || normalizedLang === "c") {
    grammar = Prism.languages.cpp || Prism.languages.c || Prism.languages.clike;
    prismLang = "cpp";
  } else if (normalizedLang === "python" || normalizedLang === "py") {
    grammar = Prism.languages.python;
    prismLang = "python";
  } else if (normalizedLang === "javascript" || normalizedLang === "js" || normalizedLang === "node") {
    grammar = Prism.languages.javascript || Prism.languages.clike;
    prismLang = "javascript";
  } else {
    grammar = Prism.languages.java || Prism.languages.clike;
    prismLang = "java";
  }

  try {
    if (grammar) {
      return Prism.highlight(rawCode, grammar, prismLang);
    }
  } catch {
    // fallback to safe html escape
  }

  return escapeHtml(rawCode);
};
