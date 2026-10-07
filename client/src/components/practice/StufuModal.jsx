import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Copy,
  Check,
  Terminal,
  Code2,
  BookOpen,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

const DEFAULT_TEMPLATES = {
  java: (title, isCp = false) =>
    isCp
      ? `// Problem: ${title || "Solution"}
// Write your code below and click "Run (Ctrl+↵)"

import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}`
      : `// Problem: ${title || "Solution"}
// LeetCode Solution Template

class Solution {
    // Write your solution method below:
    
}`,

  cpp: (title, isCp = false) =>
    isCp
      ? `// Problem: ${title || "Solution"}
// Write your code below and click "Run (Ctrl+↵)"

#include <iostream>
#include <vector>

using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}`
      : `// Problem: ${title || "Solution"}
// LeetCode Solution Template

#include <vector>
#include <string>
#include <algorithm>
#include <unordered_map>

using namespace std;

class Solution {
public:
    // Write your solution method below:
    
};`,

  python: (title, isCp = false) =>
    isCp
      ? `# Problem: ${title || "Solution"}
# Write your code below and click "Run (Ctrl+↵)"

import sys

def solve():
    # Write your solution here
    pass

if __name__ == "__main__":
    solve()`
      : `# Problem: ${title || "Solution"}
# LeetCode Solution Template

from typing import List, Optional

class Solution:
    # Write your solution method below:
    pass`,

  javascript: (title) => `// Problem: ${title || "Solution"}
// LeetCode Solution

/**
 * @return {*}
 */
var solution = function() {
    // Write your solution here
};`,
};

const getStarterTemplate = (lang, title = "", platformName = "LeetCode") => {
  const isCp = String(platformName || "").toLowerCase().includes("codeforces");
  const fn = DEFAULT_TEMPLATES[lang] || DEFAULT_TEMPLATES.java;
  return typeof fn === "function" ? fn(title, isCp) : fn;
};

const getApproachCode = (app, lang) => {
  if (!app) return "";
  const codes = typeof app.codes === "object" ? app.codes : typeof app.code === "object" ? app.code : null;
  if (codes) {
    return codes[lang] || codes.cpp || codes.java || codes.python || codes.javascript || Object.values(codes)[0] || "";
  }
  return typeof app.code === "string" ? app.code : "";
};

const LANG_LABELS = {
  java: "Java",
  cpp: "C++",
  python: "Python",
  javascript: "JavaScript",
  code: "Code",
};

const formatComplexity = (val, defaultVal = "O(1)") => {
  if (!val) return defaultVal;
  if (typeof val === "string") return val;
  return val.worst || val.average || val.best || val.auxiliary || val.total || val.note || defaultVal;
};

const getComplexityNote = (val) => (typeof val === "object" && val?.note) || "";

const getPlatformDisplay = (url = "", platformName = "") => {
  const u = (url || "").toLowerCase();
  const p = (platformName || "").toLowerCase();

  if (u.includes("codeforces.com") || p.includes("codeforces")) {
    return {
      label: "Codeforces Official",
      style: "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-400",
    };
  }
  if (u.includes("takeuforward.org") || p.includes("takeuforward")) {
    return {
      label: "takeUforward Practice",
      style: "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300",
    };
  }
  if (u.includes("geeksforgeeks.org") || p.includes("geeksforgeeks")) {
    return {
      label: "GeeksforGeeks",
      style: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
    };
  }
  if (u.includes("codechef.com") || p.includes("codechef")) {
    return {
      label: "CodeChef",
      style: "bg-amber-600/10 hover:bg-amber-600/20 border-amber-600/30 text-amber-400",
    };
  }
  if (u.includes("hackerrank.com") || p.includes("hackerrank")) {
    return {
      label: "HackerRank",
      style: "bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-600/30 text-emerald-400",
    };
  }
  if (u.includes("atcoder.jp") || p.includes("atcoder")) {
    return {
      label: "AtCoder",
      style: "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300",
    };
  }
  if (u.includes("leetcode.com") || p.includes("leetcode") || (!u && !p)) {
    return {
      label: "LeetCode Official",
      style: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300",
    };
  }
  return {
    label: platformName ? `${platformName} Official` : "Official Platform",
    style: "bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300",
  };
};

const formatIntuition = (val) => {
  if (!val) return "Break down the problem into smaller subproblems, optimize space and time constraints to achieve maximum efficiency.";
  return typeof val === "object" ? (val.description || val.text || val.summary || val.intuition || "") : String(val);
};

const HTML_ENTITY_MAP = {
  "&lfloor;": "⌊",
  "&rfloor;": "⌋",
  "&lceil;": "⌈",
  "&rceil;": "⌉",
  "&le;": "≤",
  "&ge;": "≥",
  "&ne;": "≠",
  "&infin;": "∞",
  "&times;": "×",
  "&divide;": "÷",
  "&plusmn;": "±",
  "&minus;": "−",
  "&radic;": "√",
  "&pi;": "π",
  "&sum;": "∑",
  "&prod;": "∏",
  "&isin;": "∈",
  "&notin;": "∉",
  "&cap;": "∩",
  "&cup;": "∪",
  "&sub;": "⊂",
  "&sube;": "⊆",
  "&sup;": "⊃",
  "&supe;": "⊇",
  "&bull;": "•",
  "&hellip;": "…",
  "&prime;": "′",
  "&Prime;": "″",
  "&sim;": "∼",
  "&asymp;": "≈",
  "&nbsp;": " ",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&ldquo;": '"',
  "&rdquo;": '"',
  "&lsquo;": "'",
  "&rsquo;": "'",
  "&mdash;": "—",
  "&ndash;": "–",
};

const decodeHtmlEntities = (str) => {
  if (!str || typeof str !== "string") return "";
  let decoded = str.replace(/&(?:[a-zA-Z]+|#\d+|#x[a-fA-F0-9]+);/g, (match) => {
    if (HTML_ENTITY_MAP[match]) return HTML_ENTITY_MAP[match];
    if (match.startsWith("&#x")) {
      const hex = parseInt(match.slice(3, -1), 16);
      return !isNaN(hex) ? String.fromCodePoint(hex) : match;
    }
    if (match.startsWith("&#")) {
      const dec = parseInt(match.slice(2, -1), 10);
      return !isNaN(dec) ? String.fromCodePoint(dec) : match;
    }
    return match;
  });

  if (typeof window !== "undefined" && decoded.includes("&")) {
    try {
      const doc = new DOMParser().parseFromString(decoded, "text/html");
      decoded = doc.body.textContent || decoded;
    } catch {
      // fallback
    }
  }
  return decoded;
};

const renderFormattedRichText = (rawText) => {
  if (!rawText) return null;
  let decoded = decodeHtmlEntities(String(rawText));
  decoded = decoded.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

  const tokenRegex = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
  const parts = decoded.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const code = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="mx-0.5 px-1.5 py-0.5 rounded bg-neutral-800/80 text-amber-200/90 font-mono text-[11.5px] border border-neutral-700/60 shadow-xs inline-block align-baseline"
        >
          {code}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-neutral-100">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={idx} className="italic text-neutral-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <span key={idx}>{part}</span>;
  });
};

export default function StufuModal({
  isOpen,
  onClose,
  problem,
  initialShowSolution = false,
  onProblemSolved,
}) {
  const [showSolution, setShowSolution] = useState(initialShowSolution);
  const [splitRatio, setSplitRatio] = useState(42); // 42% left, 58% right
  const [isDragging, setIsDragging] = useState(false);
  const [editorHeightPercent, setEditorHeightPercent] = useState(58); // 58% editor, 42% console
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  // Solution state
  const [solutionData, setSolutionData] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  const [activeApproachTab, setActiveApproachTab] = useState(0); // 0 = Brute, 1 = Better, 2 = Optimal
  const [copiedCode, setCopiedCode] = useState(false);
  const [refLanguage, setRefLanguage] = useState(null);

  // Compiler & Judge state
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("");
  const isRunning = false;
  const isSubmitting = false;
  const [runResult, setRunResult] = useState(null);
  const activeConsoleTab = "output";
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);

  const containerRef = useRef(null);
  const rightPanelSplitRef = useRef(null);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const problemKey = problem?.id || problem?.title || problem?.key || "";

  // Sync initial showSolution prop whenever modal opens or problem changes
  useEffect(() => {
    if (isOpen) {
      setShowSolution(Boolean(initialShowSolution));
    }
  }, [isOpen, initialShowSolution, problemKey]);

  const currentPlatformName = useMemo(() => {
    const rawUrl = (
      problem?.platformUrl ||
      problem?.leetcodeUrl ||
      problem?.url ||
      problem?.questionUrl ||
      ""
    ).toLowerCase();
    const p = (problem?.platform || solutionData?.platform || "").toLowerCase();

    if (rawUrl.includes("codeforces.com") || p.includes("codeforces")) return "Codeforces";
    if (rawUrl.includes("geeksforgeeks.org") || p.includes("geeksforgeeks") || p === "gfg") return "GeeksforGeeks";
    if (rawUrl.includes("codechef.com") || p.includes("codechef")) return "CodeChef";
    if (rawUrl.includes("hackerrank.com") || p.includes("hackerrank")) return "HackerRank";
    if (rawUrl.includes("atcoder.jp") || p.includes("atcoder")) return "AtCoder";
    if (rawUrl.includes("takeuforward.org") || p.includes("takeuforward") || p === "tuf") return "takeUforward";
    if (rawUrl.includes("leetcode.com") || p.includes("leetcode")) return "LeetCode";

    if (problem?.platform && !["problem link", "official platform"].includes(problem.platform.toLowerCase())) {
      return problem.platform;
    }
    if (solutionData?.platform) return solutionData.platform;
    return "LeetCode";
  }, [problem, solutionData]);

  // Initialize editor code with clean starter template when modal opens with a problem
  useEffect(() => {
    if (isOpen && problem) {
      setCode(getStarterTemplate(language, problem.title, currentPlatformName));
      setRunResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, problemKey]);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

    // Reset reference language selection when approach tab or problem changes
    useEffect(() => {
      setRefLanguage(null);
    }, [activeApproachTab, problemKey]);

    // Fetch curated solution editorial notes for the left panel
    useEffect(() => {
      if (!isOpen || !problem) return;

      let isMounted = true;
      const fetchSolution = async () => {
        try {
          setLoadingSolution(true);
          const queryParams = new URLSearchParams();
          if (problem.platform) queryParams.set("platform", problem.platform);
          if (problem.leetcodeSlug) queryParams.set("slug", problem.leetcodeSlug);
          if (problem.leetcodeId) queryParams.set("id", String(problem.leetcodeId));
          if (problem.tufHref) queryParams.set("tufHref", problem.tufHref);
          const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
          const res = await api.get(`/practice/solution/${encodeURIComponent(problem.title || problem.key)}${qs}`);
          if (isMounted && res.data.success) {
            setSolutionData(res.data);
            // Default approach tab to Optimal in editorial guide
            if (res.data.approaches && res.data.approaches.length > 0) {
              const cleanApproaches = res.data.approaches.filter(
                (a) => !["takeuforward", "tuf"].includes(a.name?.trim().toLowerCase())
              );
              const list = cleanApproaches.length > 0 ? cleanApproaches : res.data.approaches;
              const optimalIdx = list.findIndex(
                (a) => a.name?.toLowerCase().includes("optimal")
              );
              const targetIdx = optimalIdx !== -1 ? optimalIdx : 0;
              setActiveApproachTab(targetIdx);

              // Automatically load the Optimal approach code directly into the compiler editor
              const optApp = list[targetIdx];
              const optCode =
                getApproachCode(optApp, language) ||
                getApproachCode(optApp, "java") ||
                getApproachCode(optApp, "cpp") ||
                "";
              if (optCode) {
                setCode(optCode);
                if (optApp.code?.java && !optApp.code?.[language]) {
                  setLanguage("java");
                } else if (optApp.code?.cpp && !optApp.code?.[language]) {
                  setLanguage("cpp");
                }
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch solution:", err);
        } finally {
          if (isMounted) setLoadingSolution(false);
        }
      };

      fetchSolution();
      return () => {
        isMounted = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, problemKey, problem?.leetcodeSlug, problem?.platform, problem?.tufHref]);

    // Computed curated approaches with fallback to ensure editorial tab is always present and interactive
    const approaches = useMemo(() => {
      const raw = solutionData?.approaches || [];
      const filtered = raw.filter(
        (app) => !["takeuforward", "tuf"].includes(app.name?.trim().toLowerCase())
      );
      if (filtered.length > 0) return filtered;
      if (raw.length > 0) {
        return raw.map((app) =>
          ["takeuforward", "tuf"].includes(app.name?.trim().toLowerCase())
            ? { ...app, name: "Optimal" }
            : app
        );
      }
      return [
        {
          name: "Optimal",
          timeComplexity: "O(N)",
          spaceComplexity: "O(1)",
          intuition:
            solutionData?.problemStatement ||
            `Analyze the core patterns, constraints, and edge cases for "${problem?.title || "this problem"}". Formulate the optimal approach and test your solution.`,
          code: solutionData?.defaultCode || "",
          codes: {
            java: solutionData?.defaultCode || "",
          },
        },
      ];
    }, [solutionData?.approaches, solutionData?.problemStatement, solutionData?.defaultCode, problem?.title]);

    // Handle approach selection from tabs — updates editorial AND loads code into compiler
    const handleSelectApproach = (idx) => {
      setActiveApproachTab(idx);
      const targetApp = approaches[idx];
      if (targetApp) {
        const targetCode =
          getApproachCode(targetApp, language) ||
          getApproachCode(targetApp, "java") ||
          getApproachCode(targetApp, "cpp") ||
          "";
        if (targetCode) {
          setCode(targetCode);
          const codes = targetApp.codes || (typeof targetApp.code === "object" ? targetApp.code : null);
          if (codes?.java && !codes?.[language]) {
            setLanguage("java");
          } else if (codes?.cpp && !codes?.[language]) {
            setLanguage("cpp");
          }
        }
      }
    };

    // Handle language switch template or curated implementation
    const handleLanguageChange = (newLang) => {
      setLanguage(newLang);
      const activeApp = approaches[activeApproachTab];
      if (activeApp) {
        const appCode = getApproachCode(activeApp, newLang);
        if (appCode) {
          setCode(appCode);
          return;
        }
      }
      setCode(getStarterTemplate(newLang, problem?.title, currentPlatformName));
    };

    // Draggable divider handlers
    const handleMouseDown = useCallback((e) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const newRatio = (currentX / rect.width) * 100;
        if (newRatio >= 25 && newRatio <= 75) {
          setSplitRatio(newRatio);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      if (isDragging) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging]);

    const handleVerticalMouseDown = useCallback((e) => {
      e.preventDefault();
      setIsDraggingVertical(true);
    }, []);

    useEffect(() => {
      const handleMouseMove = (e) => {
        if (!isDraggingVertical || !rightPanelSplitRef.current) return;
        const rect = rightPanelSplitRef.current.getBoundingClientRect();
        const currentY = e.clientY - rect.top;
        const newRatio = (currentY / rect.height) * 100;
        if (newRatio >= 18 && newRatio <= 85) {
          setEditorHeightPercent(newRatio);
        }
      };

      const handleMouseUp = () => {
        setIsDraggingVertical(false);
      };

      if (isDraggingVertical) {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDraggingVertical]);

    // Tab key indent handler for code editor
    const handleKeyDown = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        const newCode = code.substring(0, start) + "    " + code.substring(end);
        setCode(newCode);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
          }
        }, 0);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleForwardToPlatform();
      }
    };

    // Sync line numbers scroll
    const handleEditorScroll = () => {
      if (textareaRef.current) {
        const top = textareaRef.current.scrollTop;
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = top;
        }
      }
    };

    // Copy code to clipboard and open problem on official judge / platform
    const handleForwardToPlatform = async () => {
      if (!code.trim()) {
        toast.error("No code to copy. Select an approach or write code first.");
        return;
      }

      const isCodeforces = currentPlatformName === "Codeforces";

      const problemSlug =
        problem.leetcodeSlug ||
        (problem.platformUrl || problem.leetcodeUrl || "").match(/problems\/([^/]+)/)?.[1] ||
        problem.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      const targetUrl =
        problem.platformUrl ||
        problem.leetcodeUrl ||
        problem.url ||
        problem.questionUrl ||
        (isCodeforces ? "https://codeforces.com/problemset" : null) ||
        (problemSlug ? `https://leetcode.com/problems/${problemSlug}/` : null);

      if (!targetUrl) {
        toast.error(`No official URL available for this ${currentPlatformName} problem.`);
        return;
      }

      // 1. Copy code to clipboard (ensure class Solution for LeetCode)
      try {
        let codeToCopy = code;
        if (currentPlatformName === "LeetCode") {
          codeToCopy = codeToCopy
            .replace(/public\s+class\s+Main\b/g, "class Solution")
            .replace(/class\s+Main\b/g, "class Solution");
        }
        await navigator.clipboard.writeText(codeToCopy);
        toast.success(`📋 Solution copied! Opening ${currentPlatformName}...`);
      } catch {
        toast.error("Failed to copy code to clipboard.");
      }

      // 2. Open clean target URL directly in new tab
      window.open(targetUrl, "_blank");
    };

    // Toggle problem solved state locally & in database
    const handleToggleSolved = () => {
      if (problem) {
        onProblemSolved?.(problem.key || problem.title);
        toast.success("Problem marked as solved! 🎉");
      }
    };

    // Copy solution code
    const handleCopySolution = (textToCopy) => {
      if (!textToCopy) return;
      navigator.clipboard.writeText(textToCopy);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    };

    const lineCount = useMemo(() => {
      return Math.max(1, code.split("\n").length);
    }, [code]);

    const rawApproach = approaches[activeApproachTab] || approaches[0] || null;

    // Extract all available language implementations for the active approach
    const approachCodes = useMemo(() => {
      if (!rawApproach) return {};
      if (rawApproach.codes && typeof rawApproach.codes === "object") {
        return rawApproach.codes;
      }
      if (rawApproach.code && typeof rawApproach.code === "object") {
        return rawApproach.code;
      }
      if (typeof rawApproach.code === "string" && rawApproach.code.trim()) {
        const s = rawApproach.code;
        let detected = "code";
        if (s.includes("#include") || s.includes("using namespace std;")) detected = "cpp";
        else if (s.includes("import java") || s.includes("public class") || s.includes("class Solution {")) detected = "java";
        else if (s.includes("def ") || s.includes("import sys") || s.includes("print(")) detected = "python";
        else if (s.includes("function ") || s.includes("const ") || s.includes("console.log")) detected = "javascript";
        return { [detected]: s };
      }
      return {};
    }, [rawApproach]);

    const availableRefLangs = useMemo(() => {
      return Object.keys(approachCodes).filter((k) => Boolean(approachCodes[k]?.trim()));
    }, [approachCodes]);

    const activeRefLang = useMemo(() => {
      if (refLanguage && approachCodes[refLanguage]) {
        return refLanguage;
      }
      const priority = ["java", "cpp", "python", "javascript"];
      for (const p of priority) {
        if (approachCodes[p]) return p;
      }
      return availableRefLangs[0] || "code";
    }, [refLanguage, approachCodes, availableRefLangs]);

    const activeApproachCode =
      approachCodes[activeRefLang] ||
      (typeof rawApproach?.code === "string" ? rawApproach.code : "") ||
      "";

    const activeApproach = rawApproach
      ? {
        ...rawApproach,
        code: activeApproachCode,
      }
      : {
        name: "Optimal",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        code: solutionData?.defaultCode || code,
      };

    if (!isOpen || !problem) return null;

    return createPortal(
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4"
      >
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Problem and Compiler Studio"
          className="w-full h-[95vh] max-w-7xl bg-[#121214] border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl select-none"
        >
          {/* Top Header Bar */}
          <div data-stufu-header="true" className="min-h-[52px] bg-[#0E0E12] border-b border-neutral-800 px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 mr-2">
              <span className="shrink-0 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                #{problem.leetcodeId || problem.id || "DSA"}
              </span>

              <h2
                className="text-sm font-semibold text-neutral-100 truncate min-w-0"
                title={decodeHtmlEntities(problem.title)}
              >
                {decodeHtmlEntities(problem.title)}
              </h2>

              <span
                className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${problem.leetcodeDifficulty === "Easy"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    : problem.leetcodeDifficulty === "Hard"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                  }`}
              >
                {problem.leetcodeDifficulty || "Medium"}
              </span>

              {(problem.platformUrl || problem.leetcodeUrl || problem.url || problem.questionUrl) && (
                <a
                  href={problem.platformUrl || problem.leetcodeUrl || problem.url || problem.questionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 hidden xl:flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition"
                  title={`Open official problem on ${currentPlatformName}`}
                >
                  <span>{currentPlatformName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {(problem.solutionUrl || problem.instructorUrl) && (
                <a
                  href={problem.solutionUrl || problem.instructorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-100 transition"
                  title="Open instructor's provided solution / notes / video"
                >
                  <span>Instructor Notes</span>
                  <ExternalLink className="w-3 h-3 text-purple-400" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Toggle Solution Sheet Button */}
              <button
                type="button"
                onClick={() => setShowSolution((prev) => !prev)}
                className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${showSolution
                    ? "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20"
                    : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700"
                  }`}
                title={showSolution ? "Hide Solution Sheet" : "Open Curated Solution Sheet"}
              >
                <BookOpen className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{showSolution ? "Hide Solution" : "View Solution"}</span>
              </button>

              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="shrink-0 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-neutral-200 outline-none hover:border-neutral-700 focus:border-red-500 cursor-pointer"
              >
                <option value="java">Java 21</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="python">Python 3.12</option>
                <option value="javascript">Node.js 20</option>
              </select>

              {/* Reset to Blank Starter Button */}
              <button
                type="button"
                onClick={() => setCode(getStarterTemplate(language, problem?.title))}
                className="shrink-0 p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition cursor-pointer"
                title="Reset editor to blank starter template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Copy to Clipboard & Open on Platform Button */}
              <button
                type="button"
                onClick={handleForwardToPlatform}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md ${currentPlatformName === "Codeforces"
                    ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-500/20"
                    : currentPlatformName === "GeeksforGeeks"
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/20"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-orange-500/20"
                  }`}
                title={`Copy solution to clipboard and open problem on ${currentPlatformName} (Ctrl+↵)`}
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span>Copy & Open {currentPlatformName}</span>
              </button>

              {/* Mark as Solved Button */}
              <button
                type="button"
                onClick={handleToggleSolved}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Mark this problem as completed"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Mark Solved</span>
                <span className="sm:hidden">Solved</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition cursor-pointer"
                title="Close editor (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Split Body */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* LEFT PANEL: Curated Solution Sheet */}
            {showSolution && (
              <div
                style={{ width: `${splitRatio}%` }}
                className="h-full flex flex-col border-r border-neutral-800 bg-[#0E0E12]/95 overflow-hidden shrink-0 select-text"
              >
                {/* Solution Sub-tabs */}
                <div className="h-11 bg-[#121214] border-b border-neutral-800 px-3 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1">
                    {approaches.length > 0 ? (
                      approaches.map((app, idx) => {
                        const isTabActive = activeApproachTab === idx;
                        const isOptimal = app.name?.toLowerCase().includes("optimal");
                        const isBetter = app.name?.toLowerCase().includes("better");

                        return (
                          <button
                            key={app.name || idx}
                            type="button"
                            onClick={() => handleSelectApproach(idx)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${isTabActive
                                ? isOptimal
                                  ? "bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm"
                                  : isBetter
                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm"
                                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm"
                                : "text-neutral-400 hover:text-neutral-200 border border-transparent"
                              }`}
                          >
                            <span>{app.name}</span>
                            {isOptimal && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                ★
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5 px-1">
                        <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
                        Editorial Notes
                      </span>
                    )}
                  </div>

                  {activeApproach?.code && (
                    <button
                      type="button"
                      onClick={() => handleCopySolution(activeApproachCode)}
                      className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-neutral-400" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Solution Content Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-neutral-300 leading-relaxed font-sans">
                  {loadingSolution ? (
                    <div className="py-12 text-center text-neutral-400">
                      Loading curated solution and complexities...
                    </div>
                  ) : approaches.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 mx-auto">
                        <BookOpen className="w-6 h-6 text-neutral-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-neutral-200">
                        {(problem.solutionUrl || problem.instructorUrl) ? "Instructor Solution Available" : "No data for notes section"}
                      </h4>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                        {(problem.solutionUrl || problem.instructorUrl)
                          ? "The instructor provided notes, video, or a solution document for this problem in your sheet."
                          : "This imported problem does not have curated notes or solutions in the local database. You can implement and test your code directly in the compiler studio."}
                      </p>
                      {(problem.solutionUrl || problem.instructorUrl) && (
                        <div className="pt-2">
                          <a
                            href={problem.solutionUrl || problem.instructorUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-200 text-xs font-medium transition shadow-xs"
                          >
                            <span>Open Instructor's Solution</span>
                            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {(problem.solutionUrl || problem.instructorUrl) && (
                        <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-purple-200">Instructor's Solution / Notes</p>
                            <p className="text-[11px] text-purple-300/70 truncate">Attached from your imported sheet</p>
                          </div>
                          <a
                            href={problem.solutionUrl || problem.instructorUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-[11px] font-medium transition"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3 text-purple-400" />
                          </a>
                        </div>
                      )}
                      {/* Problem Statement */}
                      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
                        <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-red-400" />
                          Problem Statement
                        </h3>
                        <div className="whitespace-pre-line text-neutral-300 text-xs leading-relaxed space-y-2">
                          {renderFormattedRichText(solutionData?.problemStatement || "Solve the problem using the optimal algorithms.")}
                        </div>

                        {/* Constraints */}
                        {Array.isArray(solutionData?.constraints) && solutionData.constraints.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-neutral-800/80">
                            <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                              Constraints
                            </h4>
                            <ul className="space-y-1.5 text-xs text-neutral-300">
                              {solutionData.constraints.map((c, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-neutral-500 mt-0.5 select-none leading-none">•</span>
                                  <div className="min-w-0 font-mono text-[11.5px] leading-relaxed text-neutral-300">
                                    {renderFormattedRichText(c)}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {solutionData?.examples && (
                          <div className="mt-3 pt-3 border-t border-neutral-800 font-mono text-[11px] text-neutral-300 whitespace-pre-line bg-[#0E0E12] p-2.5 rounded-lg border border-neutral-800">
                            {decodeHtmlEntities(solutionData.examples)}
                          </div>
                        )}
                      </div>

                      {/* Approach & Intuition */}
                      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <h3 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-red-400" />
                            <span>{activeApproach.name} Intuition & Logic</span>
                          </h3>
                          {activeApproach.url && (
                            <a
                              href={activeApproach.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 shrink-0 border ${getPlatformDisplay(activeApproach.url, problem?.platform || solutionData?.platform).style
                                }`}
                            >
                              <span>
                                {getPlatformDisplay(activeApproach.url, problem?.platform || solutionData?.platform).label}
                              </span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-neutral-300 leading-relaxed whitespace-pre-line text-xs">
                          {renderFormattedRichText(formatIntuition(activeApproach.intuition))}
                        </div>
                      </div>


                      {/* Curated Reference Code Block */}
                      <div className="bg-[#0E0E12] border border-neutral-800 rounded-xl overflow-hidden">
                        <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5 text-red-400" />
                              <span>{activeApproach.name} Implementation</span>
                            </span>

                            {/* Language Selection Pills */}
                            {availableRefLangs.length > 1 ? (
                              <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-neutral-800">
                                {availableRefLangs.map((lKey) => {
                                  const isActive = activeRefLang === lKey;
                                  const label = LANG_LABELS[lKey] || lKey.toUpperCase();
                                  return (
                                    <button
                                      key={lKey}
                                      type="button"
                                      onClick={() => setRefLanguage(lKey)}
                                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${isActive
                                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                                          : "text-neutral-400 hover:text-neutral-200 border border-transparent"
                                        }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : availableRefLangs.length === 1 && (
                              <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-semibold">
                                {LANG_LABELS[availableRefLangs[0]] || availableRefLangs[0].toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopySolution(activeApproachCode)}
                              className="text-neutral-400 hover:text-neutral-200 transition cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Copy code"
                            >
                              {copiedCode ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <span className="text-neutral-700">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCode(activeApproachCode);
                                if (["java", "cpp", "python", "javascript"].includes(activeRefLang)) {
                                  setLanguage(activeRefLang);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 transition cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                              title="Load into compiler editor"
                            >
                              <span>Load into Compiler</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                        <pre
                          className="p-3 font-mono text-[11px] text-neutral-200 overflow-x-auto leading-5 max-h-80 whitespace-pre selection:bg-red-500/30"
                          style={{ tabSize: 4, MozTabSize: 4 }}
                        >
                          {activeApproachCode}
                        </pre>
                      </div>
                    </>
                  )}
                </div>

                {/* Dynamic Complexity Footer */}
                <div data-stufu-header="true" className="h-12 bg-[#121214] border-t border-neutral-800 px-4 flex items-center justify-between text-xs font-mono shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Time:</span>
                    <span
                      title={getComplexityNote(activeApproach.timeComplexity)}
                      className="px-2 py-0.5 rounded bg-neutral-900 text-red-400 border border-neutral-800 font-semibold cursor-help"
                    >
                      {formatComplexity(activeApproach.timeComplexity, "O(N)")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Space:</span>
                    <span
                      title={getComplexityNote(activeApproach.spaceComplexity)}
                      className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 font-semibold cursor-help"
                    >
                      {formatComplexity(activeApproach.spaceComplexity, "O(1)")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* DRAGGABLE DIVIDER */}
            {showSolution && (
              <div
                onMouseDown={handleMouseDown}
                className={`w-1.5 hover:w-2 transition-all cursor-col-resize flex items-center justify-center shrink-0 z-10 ${isDragging ? "bg-red-500" : "bg-neutral-800 hover:bg-red-500/50"
                  }`}
                title="Drag to resize panels"
              >
                <div className="h-6 w-0.5 bg-neutral-600 rounded-full" />
              </div>
            )}

            {/* RIGHT PANEL: STUFU COMPILER */}
            <div
              data-stufu-editor="true"
              style={{ width: showSolution ? `${100 - splitRatio}%` : "100%" }}
              className={`h-full flex flex-col bg-[#0E0E12] overflow-hidden flex-1 ${isDragging ? "" : "transition-all duration-150"
                }`}
            >
              {/* Editor Sub-header */}
              <div data-stufu-header="true" className="h-11 bg-[#121214] border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-medium text-neutral-200">
                    Stufu In-App Editor
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    ({lineCount} lines)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCode(getStarterTemplate(language, problem?.title, currentPlatformName))}
                    className="text-xs text-neutral-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                    title="Reset to starter template"
                  >
                    <RotateCcw className="w-3 h-3 text-neutral-400" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Flexible Split Container (Editor + Console) */}
              <div
                ref={rightPanelSplitRef}
                className="flex-1 flex flex-col min-h-0 overflow-hidden relative"
              >
                {/* Code Editor Body with Line Numbers */}
                <div
                  style={{ height: `${editorHeightPercent}%` }}
                  className={`flex overflow-hidden relative font-mono text-xs min-h-0 shrink-0 ${isDraggingVertical ? "select-none pointer-events-none" : "select-text"
                    }`}
                >
                  {/* Line Numbers Gutter */}
                  <div
                    ref={lineNumbersRef}
                    data-stufu-gutter="true"
                    className="w-12 bg-[#0E0E12] text-neutral-600 border-r border-neutral-800 select-none py-3 text-right pr-3 font-mono leading-5 overflow-hidden shrink-0"
                  >
                    {Array.from({ length: lineCount }).map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>

                  {/* Editor Container */}
                  <div data-stufu-body="true" className="flex-1 relative h-full overflow-hidden bg-[#0E0E12]">
                    <textarea
                      ref={textareaRef}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onScroll={handleEditorScroll}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoComplete="off"
                      autoCorrect="off"
                      placeholder="Write your code solution here..."
                      style={{ tabSize: 4, MozTabSize: 4 }}
                      className="absolute inset-0 w-full h-full p-3 font-mono text-xs leading-5 outline-none resize-none overflow-auto whitespace-pre m-0 border-0 bg-transparent text-neutral-100 placeholder:text-neutral-500 caret-white selection:bg-red-500/30 selection:text-white"
                    />
                  </div>
                </div>

                {/* VERTICAL DRAGGABLE RESIZER DIVIDER */}
                <div
                  onMouseDown={handleVerticalMouseDown}
                  className={`group h-1.5 hover:h-2 transition-all cursor-row-resize flex items-center justify-center shrink-0 z-20 ${isDraggingVertical
                      ? "bg-red-500 shadow-sm shadow-red-500/30"
                      : "bg-neutral-800 hover:bg-red-500/50"
                    }`}
                  title="Drag to resize editor and console"
                >
                  <div className="w-8 h-0.5 bg-neutral-600 group-hover:bg-neutral-300 rounded-full transition-colors" />
                </div>

                {/* BOTTOM CONSOLE & RUNNER VERDICT */}
                <div
                  data-stufu-console="true"
                  className={`flex-1 min-h-0 bg-[#121214]/95 flex flex-col overflow-hidden ${isDraggingVertical ? "select-none pointer-events-none" : ""
                    }`}
                >
                  {/* Console Tabs */}
                  <div data-stufu-console-header="true" className="h-9 bg-[#0E0E12] border-b border-neutral-800 px-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 text-neutral-300">
                        <Terminal
                          className={`w-3 h-3 ${currentPlatformName === "Codeforces" ? "text-sky-400" : "text-amber-400"
                            }`}
                        />
                        <span>{currentPlatformName} Forward & Output</span>
                      </div>
                    </div>

                    {runResult && (
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span
                          className={
                            runResult.verdict === "Accepted"
                              ? "text-emerald-400 font-semibold flex items-center gap-1"
                              : runResult.verdict === "Wrong Answer"
                                ? "text-rose-400 font-semibold flex items-center gap-1"
                                : runResult.success
                                  ? "text-emerald-400 font-semibold"
                                  : "text-rose-400 font-semibold"
                          }
                        >
                          {runResult.verdict === "Accepted" ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accepted</span>
                            </>
                          ) : runResult.verdict === "Wrong Answer" ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Wrong Answer</span>
                            </>
                          ) : runResult.success ? (
                            "✅ Execution Passed"
                          ) : (
                            "❌ Compilation / Error"
                          )}
                        </span>
                        <span className="text-neutral-400">
                          Runtime: {runResult.runtime}ms
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Console Body */}
                  <div className="flex-1 p-3 overflow-y-auto font-mono text-xs select-text">
                    {activeConsoleTab === "output" ? (
                      isSubmitting ? (
                        <div className="py-8 flex flex-col items-center justify-center space-y-3 font-sans">
                          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                          <div className="text-xs text-neutral-200 font-medium">Judging submission against test cases...</div>
                          <div className="text-[11px] text-neutral-400 font-mono">Running sandbox evaluation</div>
                        </div>
                      ) : isRunning ? (
                        <div className="text-neutral-300 animate-pulse flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Running code in Stufu sandbox environment...
                        </div>
                      ) : runResult ? (
                        <div className="space-y-2 leading-relaxed">
                          {/* Accepted Verdict Card */}
                          {runResult.verdict === "Accepted" ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4 space-y-3 font-sans">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                    ✓
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-emerald-400">Accepted</h4>
                                    <p className="text-[11px] text-neutral-400 font-mono">
                                      All {runResult.totalCount || runResult.passedCount} test cases passed successfully!
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-mono">
                                  <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                                    Runtime: <span className="text-emerald-400 font-semibold">{runResult.runtime}ms</span>
                                  </div>
                                  {runResult.beatsPercent && (
                                    <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                                      Beats: <span className="text-emerald-400 font-semibold">{runResult.beatsPercent}%</span>
                                    </div>
                                  )}
                                  {runResult.memory && (
                                    <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                                      Memory: <span className="text-neutral-200">{runResult.memory}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {runResult.isSolved && (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-medium">
                                  <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>Problem marked as SOLVED in your dashboard & streak updated! 🔥</span>
                                </div>
                              )}
                            </div>
                          ) : runResult.verdict === "Wrong Answer" ? (
                            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 space-y-3 font-sans">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                                  ✕
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-rose-400">Wrong Answer</h4>
                                  <p className="text-[11px] text-neutral-400 font-mono">
                                    Failed at Testcase {runResult.failedCase?.id || 1}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                                <div className="bg-[#0E0E12] border border-neutral-800 rounded-lg p-2.5 space-y-1">
                                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Input</span>
                                  <div className="text-neutral-200">{runResult.failedCase?.input || "N/A"}</div>
                                </div>
                                <div className="bg-[#0E0E12] border border-neutral-800 rounded-lg p-2.5 space-y-1">
                                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Expected Output</span>
                                  <div className="text-emerald-400 font-semibold">{runResult.failedCase?.expected || "N/A"}</div>
                                </div>
                              </div>

                              <div className="bg-[#0E0E12] border border-neutral-800 rounded-lg p-2.5 space-y-1 font-mono text-xs">
                                <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Your Output</span>
                                <div className="text-rose-400">{runResult.failedCase?.actual || runResult.stdout || "No output produced"}</div>
                              </div>
                            </div>
                          ) : runResult.verdict === "Compilation Error" || runResult.verdict === "Runtime Error" ? (
                            <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-4 space-y-2 font-sans">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                                  ✕
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-rose-400">{runResult.verdict}</h4>
                                  <p className="text-[11px] text-neutral-400 font-mono">
                                    Execution failed in compiler sandbox
                                  </p>
                                </div>
                              </div>
                              <div className="bg-[#0E0E12] border border-rose-500/20 rounded-lg p-3 font-mono text-xs text-rose-400 whitespace-pre-wrap">
                                {runResult.error || runResult.stderr || runResult.stdout || "Error during execution"}
                              </div>
                            </div>
                          ) : (
                            <>
                              {runResult.stdout && (
                                <div className="text-neutral-200 whitespace-pre-wrap bg-neutral-900/40 p-3 rounded-lg border border-neutral-800 font-mono">
                                  {runResult.stdout}
                                </div>
                              )}
                              {runResult.stderr && (
                                <div className="text-rose-400 whitespace-pre-wrap bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 font-mono">
                                  {runResult.stderr}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-neutral-400 flex items-center gap-2">
                          <Sparkles
                            className={`w-4 h-4 shrink-0 ${currentPlatformName === "Codeforces"
                                ? "text-sky-400"
                                : currentPlatformName === "GeeksforGeeks"
                                  ? "text-emerald-400"
                                  : "text-amber-400"
                              }`}
                          />
                          <span>
                            Select an approach (<span className="text-neutral-200">Brute</span> / <span className="text-neutral-200">Better</span> / <span className="text-neutral-200">Optimal</span>) & language, then click{" "}
                            <span
                              className={`font-semibold ${currentPlatformName === "Codeforces"
                                  ? "text-sky-400"
                                  : currentPlatformName === "GeeksforGeeks"
                                    ? "text-emerald-400"
                                    : "text-amber-400"
                                }`}
                            >
                              Copy & Open {currentPlatformName}
                            </span>{" "}
                            to forward the solution directly into {currentPlatformName}.
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="h-full flex flex-col space-y-2.5 font-sans">
                        {(solutionData?.testCases || []).length > 0 ? (
                          <>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {(solutionData?.testCases || []).map((tc, idx) => (
                                <button
                                  key={tc.id || idx}
                                  type="button"
                                  onClick={() => setSelectedTestCaseIndex(idx)}
                                  className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition cursor-pointer ${selectedTestCaseIndex === idx
                                      ? "bg-neutral-800 text-white border border-neutral-700 shadow-sm"
                                      : "bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                                    }`}
                                >
                                  Case {idx + 1}
                                </button>
                              ))}
                            </div>

                            {solutionData?.testCases?.[selectedTestCaseIndex] && (
                              <div className="flex-1 space-y-2 overflow-y-auto">
                                <div className="bg-[#0E0E12] border border-neutral-800 rounded-lg p-2.5">
                                  <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider block mb-1">
                                    Input
                                  </span>
                                  <div className="text-neutral-200 font-mono text-xs whitespace-pre-wrap">
                                    {solutionData.testCases[selectedTestCaseIndex].input}
                                  </div>
                                </div>

                                <div className="bg-[#0E0E12] border border-neutral-800 rounded-lg p-2.5">
                                  <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider block mb-1">
                                    Expected Output
                                  </span>
                                  <div className="text-emerald-400 font-mono text-xs font-semibold whitespace-pre-wrap">
                                    {solutionData.testCases[selectedTestCaseIndex].expectedOutput}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-6 text-center text-neutral-400 text-xs">
                            No structured test cases listed for this problem. You can run or submit directly!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
  );
}
