import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  X,
  Save,
  Check,
  Copy,
  Trash2,
  Eye,
  Edit3,
  Loader2,
  Code,
  List,
  Bold,
  Italic,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function ProblemNotesModal({ isOpen, onClose, problem }) {
  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef(null);

  const problemKey = problem?.key || String(problem?.id || "") || problem?.title || "";
  const problemTitle = problem?.title || "Problem";
  const problemNumber = problem?.leetcodeId || problem?.number || "";
  const difficulty = problem?.leetcodeDifficulty || problem?.difficulty || "Medium";

  const diffClass =
    difficulty === "Easy"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : difficulty === "Hard"
        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
        : "bg-amber-500/10 text-amber-400 border-amber-500/30";

  const storageKey = `user_problem_notes_${problemKey}`;

  // Fetch note from backend
  const fetchNote = useCallback(async () => {
    if (!problemKey) return;
    try {
      setLoading(true);
      const res = await api.get(`/practice/problem-note/${encodeURIComponent(problemKey)}`);
      let noteText = "";
      if (res.data?.success && typeof res.data.content === "string") {
        noteText = res.data.content;
        if (res.data.updatedAt) {
          setLastSavedAt(new Date(res.data.updatedAt));
        }
      } else {
        // Fallback to local storage if available
        noteText = localStorage.getItem(storageKey) || "";
      }
      setContent(noteText);
      setInitialContent(noteText);
    } catch (err) {
      console.warn("[ProblemNotesModal] Fetch note notice:", err.message);
      const local = localStorage.getItem(storageKey) || "";
      setContent(local);
      setInitialContent(local);
    } finally {
      setLoading(false);
    }
  }, [problemKey, storageKey]);

  useEffect(() => {
    if (isOpen) {
      fetchNote();
      setIsPreview(false);
    }
  }, [isOpen, fetchNote]);

  // Save note to backend
  const handleSave = async () => {
    if (!problemKey || saving) return;

    try {
      setSaving(true);
      const res = await api.post(`/practice/problem-note/${encodeURIComponent(problemKey)}`, {
        content,
        problemTitle,
      });

      if (res.data?.success) {
        setInitialContent(content);
        localStorage.setItem(storageKey, content);
        setLastSavedAt(new Date(res.data.updatedAt || Date.now()));
        toast.success("Notes saved successfully.");
      }
    } catch (err) {
      console.error("[ProblemNotesModal] Save error:", err.message);
      // Persist locally as fallback so user work is never lost
      localStorage.setItem(storageKey, content);
      toast.error("Could not sync with cloud, saved locally on your device.");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcuts (Ctrl+S / Cmd+S, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, content, problemKey, saving]);

  // Formatting helpers
  const applyFormat = (syntax, placeholder = "text") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || placeholder;

    let replacement = "";
    if (syntax === "bold") replacement = `**${selected}**`;
    else if (syntax === "italic") replacement = `*${selected}*`;
    else if (syntax === "code") replacement = `\`${selected}\``;
    else if (syntax === "codeblock") replacement = `\n\`\`\`java\n${selected}\n\`\`\`\n`;
    else if (syntax === "bullet") replacement = `\n- ${selected}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 20);
  };

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Notes copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (!content) return;
    if (window.confirm("Are you sure you want to clear your current notes?")) {
      setContent("");
    }
  };

  if (!isOpen || !problem) return null;

  const isModified = content !== initialContent;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl h-[88vh] rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#0E0E12] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-slate-50 dark:bg-[#121215] border-b border-slate-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 truncate">
                  Personal Problem Notes
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${diffClass}`}>
                  {difficulty}
                </span>
                {isModified ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Unsaved changes
                  </span>
                ) : (
                  lastSavedAt && (
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                      Saved
                    </span>
                  )
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono truncate">
                {problemNumber ? `#${problemNumber} ` : ""}{problemTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View / Edit Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition inline-flex items-center gap-1 text-[11px] cursor-pointer"
              title={isPreview ? "Switch to edit sheet" : "Switch to Markdown preview"}
            >
              {isPreview ? <Edit3 className="w-3 h-3 text-red-500 dark:text-red-400" /> : <Eye className="w-3 h-3 text-slate-500 dark:text-neutral-400" />}
              <span>{isPreview ? "Edit Sheet" : "Preview"}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Close Notes"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar (Only visible in edit mode) */}
        {!isPreview && (
          <div className="h-10 bg-slate-50 dark:bg-[#111114] border-b border-slate-200 dark:border-neutral-800/80 px-3 flex items-center justify-between text-xs shrink-0 select-none">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyFormat("bold", "bold text")}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition cursor-pointer"
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat("italic", "italic text")}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition cursor-pointer"
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat("code", "code")}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition cursor-pointer"
                title="Inline Code"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat("codeblock", "// code")}
                className="px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 font-mono text-[11px] transition cursor-pointer"
                title="Code Block"
              >
                {"{ }"}
              </button>
              <button
                type="button"
                onClick={() => applyFormat("bullet", "list item")}
                className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition cursor-pointer"
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-500 dark:text-neutral-500">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
            </div>
          </div>
        )}

        {/* Note Body: Plain Sheet Canvas or Markdown Preview */}
        <div className="flex-1 min-h-0 bg-white dark:bg-[#0B0B0E] overflow-hidden flex flex-col relative select-text">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-neutral-500 font-mono text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              <span>Loading your notes...</span>
            </div>
          ) : isPreview ? (
            <div className="flex-1 overflow-y-auto p-5 text-slate-800 dark:text-neutral-200 prose dark:prose-invert prose-sm max-w-none leading-relaxed font-sans">
              {content.trim() ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-3 border border-slate-200 dark:border-neutral-800 rounded-lg">
                        <table className="min-w-full text-xs text-left" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th className="bg-slate-100 dark:bg-neutral-950 p-2 font-mono text-xs font-bold text-slate-800 dark:text-neutral-200 border-b border-slate-200 dark:border-neutral-800" {...props} />
                    ),
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const codeString = String(children || "").replace(/\n$/, "");
                      const isBlock = Boolean(match) || codeString.includes("\n");

                      if (isBlock) {
                        return (
                          <pre className="bg-slate-50 dark:bg-neutral-950 p-3 rounded-lg border border-slate-200 dark:border-neutral-800 font-mono text-xs overflow-x-auto text-slate-800 dark:text-neutral-200 leading-relaxed my-2">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      }

                      return (
                        <code
                          className="bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/60 px-1.5 py-0.5 rounded text-xs font-mono text-red-600 dark:text-red-300 inline align-baseline mx-0.5"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-neutral-600 text-xs font-mono select-none">
                  <FileText className="w-8 h-8 mb-2 opacity-40" />
                  <p>No notes written yet. Switch to Edit Sheet to start taking notes.</p>
                </div>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes, intuition, edge cases, formulas, or approach breakdown here...&#10;&#10;Supports Markdown:&#10;• Bullet points&#10;• **Bold**, *Italic*, `code`&#10;• Code blocks&#10;• Press Ctrl+S to save instantly"
              className="flex-1 w-full p-5 bg-transparent resize-none outline-none font-mono text-xs text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-600 leading-relaxed overflow-y-auto selection:bg-red-500/20 dark:selection:bg-red-500/30"
              spellCheck={false}
              autoFocus
            />
          )}
        </div>

        {/* Footer */}
        <div className="h-12 bg-slate-50 dark:bg-[#121215] border-t border-slate-200 dark:border-neutral-800 px-4 flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!content.trim()}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition inline-flex items-center gap-1.5 text-[11px] cursor-pointer disabled:opacity-40"
              title="Copy notes"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={!content.trim()}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition cursor-pointer disabled:opacity-40"
              title="Clear notes"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {lastSavedAt && (
              <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 dark:text-neutral-500 pl-2">
                Last saved: {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200 transition text-[11px] cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isModified}
              className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:from-[#c94242] hover:to-[#e95858] text-white font-medium transition inline-flex items-center gap-1.5 text-[11px] cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save Notes (Ctrl+S)"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  <span>Save Notes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
