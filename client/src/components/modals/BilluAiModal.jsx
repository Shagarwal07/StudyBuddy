import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  X,
  ExternalLink,
  Send,
  Loader2,
  RefreshCw,
  Lightbulb,
  Clock,
  Play,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import MarkdownContent from "../common/MarkdownContent";

// Smart helper to assign dynamic contextual icons to suggested questions
const getSuggestionIcon = (text = "") => {
  const lower = text.toLowerCase();
  if (lower.includes("hint") || lower.includes("concept") || lower.includes("intuition")) return Lightbulb;
  if (lower.includes("time") || lower.includes("space") || lower.includes("complexity") || lower.includes("optimal")) return Clock;
  if (lower.includes("run") || lower.includes("dry") || lower.includes("example") || lower.includes("trace")) return Play;
  return Sparkles;
};

// Corner spiderweb decorative vector matching the radar visual aesthetics
function SpiderwebBackdrop() {
  const radii = [60, 120, 180, 240, 300, 360];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-45">
      {/* Top Left */}
      <svg className="absolute -top-12 -left-12 w-[440px] h-[440px] stroke-rose-900/40 fill-none" viewBox="0 0 400 400">
        <line x1="0" y1="0" x2="400" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="200" strokeWidth="1" />
        <line x1="0" y1="0" x2="200" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="100" strokeWidth="1" />
        <line x1="0" y1="0" x2="100" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="300" strokeWidth="1" />
        <line x1="0" y1="0" x2="300" y2="400" strokeWidth="1" />
        {radii.map((r) => (
          <path
            key={r}
            d={`M 0,${r} Q ${r * 0.35},${r * 0.9} ${r * 0.707},${r * 0.707} Q ${r * 0.9},${r * 0.35} ${r},0`}
            strokeWidth="0.8"
          />
        ))}
      </svg>
      {/* Top Right */}
      <svg className="absolute -top-12 -right-12 w-[440px] h-[440px] stroke-rose-900/40 fill-none scale-x-[-1]" viewBox="0 0 400 400">
        <line x1="0" y1="0" x2="400" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="200" strokeWidth="1" />
        <line x1="0" y1="0" x2="200" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="100" strokeWidth="1" />
        <line x1="0" y1="0" x2="100" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="300" strokeWidth="1" />
        <line x1="0" y1="0" x2="300" y2="400" strokeWidth="1" />
        {radii.map((r) => (
          <path
            key={r}
            d={`M 0,${r} Q ${r * 0.35},${r * 0.9} ${r * 0.707},${r * 0.707} Q ${r * 0.9},${r * 0.35} ${r},0`}
            strokeWidth="0.8"
          />
        ))}
      </svg>
      {/* Bottom Left */}
      <svg className="absolute -bottom-12 -left-12 w-[440px] h-[440px] stroke-rose-900/40 fill-none scale-y-[-1]" viewBox="0 0 400 400">
        <line x1="0" y1="0" x2="400" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="200" strokeWidth="1" />
        <line x1="0" y1="0" x2="200" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="100" strokeWidth="1" />
        <line x1="0" y1="0" x2="100" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="300" strokeWidth="1" />
        <line x1="0" y1="0" x2="300" y2="400" strokeWidth="1" />
        {radii.map((r) => (
          <path
            key={r}
            d={`M 0,${r} Q ${r * 0.35},${r * 0.9} ${r * 0.707},${r * 0.707} Q ${r * 0.9},${r * 0.35} ${r},0`}
            strokeWidth="0.8"
          />
        ))}
      </svg>
      {/* Bottom Right */}
      <svg className="absolute -bottom-12 -right-12 w-[440px] h-[440px] stroke-rose-900/40 fill-none scale-[-1]" viewBox="0 0 400 400">
        <line x1="0" y1="0" x2="400" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="200" strokeWidth="1" />
        <line x1="0" y1="0" x2="200" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="100" strokeWidth="1" />
        <line x1="0" y1="0" x2="100" y2="400" strokeWidth="1" />
        <line x1="0" y1="0" x2="400" y2="300" strokeWidth="1" />
        <line x1="0" y1="0" x2="300" y2="400" strokeWidth="1" />
        {radii.map((r) => (
          <path
            key={r}
            d={`M 0,${r} Q ${r * 0.35},${r * 0.9} ${r * 0.707},${r * 0.707} Q ${r * 0.9},${r * 0.35} ${r},0`}
            strokeWidth="0.8"
          />
        ))}
      </svg>
    </div>
  );
}

export default function BilluAiModal({ isOpen, onClose, problem }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "Give me a conceptual hint",
    "What is the optimal time and space complexity?",
    "Walk through a dry run on an example",
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background page scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const problemKey = problem?.key || problem?.title || "";

  // Grounded problem context
  const problemContext = {
    title: problem?.title || "Problem",
    number: problem?.number || problem?.leetcodeId || "",
    difficulty: problem?.leetcodeDifficulty || problem?.difficulty || "Medium",
    topic: problem?.topic || problem?.module || "General DSA",
    platform: problem?.platform || "LeetCode",
    solutionUrl: problem?.solutionUrl || problem?.instructorUrl || "",
    description: problem?.description || problem?.content || "",
  };

  // Initialize fresh conversation grounded in current problem
  useEffect(() => {
    if (!isOpen || !problem?.title) return;

    const initialGreeting = {
      role: "assistant",
      text: `Hello. Let's analyze ${problem.title}${problemContext.number ? ` (#${problemContext.number})` : ""}. What initial approach or time complexity are you considering?`,
    };

    setMessages([initialGreeting]);
    setSuggestions([
      "Give me a conceptual hint",
      "What is the optimal time and space complexity?",
      "Walk through a dry run on an example",
    ]);
    setInput("");
  }, [isOpen, problemKey]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage = { role: "user", text: query };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message: query,
        history: messages.slice(-6),
        problemContext,
      });

      if (res.data?.success && res.data?.reply) {
        setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }]);
      } else {
        toast.error("Failed to receive response from Billu AI.");
      }
    } catch (err) {
      console.error("[BilluAiModal] Chat error:", err.message);
      toast.error(err.response?.data?.message || "Could not connect to Billu AI.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "An error occurred while connecting to the mentor service. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleFetchDynamicSuggestions = async () => {
    if (loadingSuggestions) return;

    try {
      setLoadingSuggestions(true);
      const res = await api.post("/ai/suggest", {
        problemContext,
        history: messages.slice(-4),
      });

      if (res.data?.success && Array.isArray(res.data.suggestions) && res.data.suggestions.length > 0) {
        setSuggestions(res.data.suggestions);
        toast.success("Suggestions updated based on discussion.");
      }
    } catch (err) {
      console.error("[BilluAiModal] Suggestion error:", err.message);
      toast.error("Could not refresh suggestions.");
    } finally {
      setLoadingSuggestions(false);
    }
  };



  if (!isOpen || !problem) return null;

  const diff = problem.leetcodeDifficulty || problem.difficulty || "Medium";
  const diffClass =
    diff === "Easy"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : diff === "Hard"
        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
        : "bg-amber-500/10 text-amber-400 border-amber-500/30";

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* Spiderweb Background Effect Matching Visual Design */}
      <SpiderwebBackdrop />

      {/* Main Modal Card */}
      <div className="w-full max-w-2xl sm:max-w-3xl h-[84vh] max-h-[780px] my-auto rounded-2xl sm:rounded-3xl border border-neutral-800/80 bg-[#0E0E12] shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative z-10">
        {/* Modal Header */}
        <div className="h-16 bg-[#111116] border-b border-neutral-800/80 px-5 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Glowing Rose/Red Gradient Icon with Sparkles */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF4D5E] to-[#E11D48] shadow-[0_0_20px_rgba(225,29,72,0.4)] border border-rose-400/30 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-neutral-100 tracking-tight truncate">
                  Billu AI Mentor
                </h3>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${diffClass}`}>
                  {diff}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono truncate">
                {problem.leetcodeId ? `#${problem.leetcodeId} ` : ""}{problem.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(problem.platformUrl || problem.leetcodeUrl) && (
              <a
                href={problem.platformUrl || problem.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white transition px-3.5 py-1.5 rounded-full bg-[#18181F] hover:bg-neutral-800 border border-neutral-700/60 font-medium"
                title="Open problem link"
              >
                <span>Problem</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#18181F] hover:bg-neutral-800 border border-neutral-700/60 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Close Billu AI"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Dedicated Billu AI Chat Engine */}
        <div className="flex-1 min-h-0 flex flex-col bg-[#0E0E12] select-text overflow-hidden">
          {/* Instructor reference alert banner if present */}
          {problemContext.solutionUrl && (
            <div className="bg-[#130E22]/90 border-b border-purple-500/25 px-5 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0 text-purple-300">
                <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-xs font-mono font-medium truncate">
                  Instructor reference material attached in sheet
                </span>
              </div>
              <a
                href={problemContext.solutionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold transition shrink-0"
              >
                <span>Open link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 text-xs text-neutral-300 leading-relaxed font-sans">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 select-none">
                    {!isUser && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-sm shrink-0">
                        <Sparkles className="w-2.5 h-2.5" />
                      </div>
                    )}
                    <span>{isUser ? "You" : "BILLU AI MENTOR"}</span>
                  </div>

                  <div
                    className={`max-w-[92%] rounded-2xl px-4 sm:px-5 py-3 text-xs sm:text-sm leading-relaxed transition ${
                      isUser
                        ? "rounded-tr-xs bg-rose-950/25 border border-rose-500/30 text-rose-100"
                        : "rounded-tl-xs bg-[#15151B] border border-neutral-800/80 text-neutral-200 shadow-sm"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <MarkdownContent content={msg.text} />
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px] py-1 pl-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                <span>Analyzing problem logic...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic Suggestions Row & Input */}
          <div className="border-t border-neutral-800/80 bg-[#0E0E12] px-5 sm:px-6 pt-3.5 pb-4 space-y-3 shrink-0">
            {/* Suggestions Header */}
            <div className="flex items-center justify-between text-[10.5px] font-mono tracking-widest text-neutral-400 uppercase font-semibold select-none">
              <span>SUGGESTED QUESTIONS</span>
              <button
                type="button"
                onClick={handleFetchDynamicSuggestions}
                disabled={loadingSuggestions}
                className="inline-flex items-center gap-1 text-xs font-mono text-rose-400 hover:text-rose-300 transition cursor-pointer select-none disabled:opacity-50"
                title="Generate dynamic follow-up questions"
              >
                <RefreshCw className={`w-3 h-3 ${loadingSuggestions ? "animate-spin" : ""}`} />
                <span>Want suggestion?</span>
              </button>
            </div>

            {/* Suggestion Chips with Contextual Icons */}
            <div className="flex flex-wrap gap-2">
              {suggestions.map((sug, sIdx) => {
                const IconComponent = getSuggestionIcon(sug);
                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => handleSendMessage(sug)}
                    disabled={loading}
                    className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#15151B] hover:bg-[#1D1D26] border border-neutral-800/90 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm"
                  >
                    <IconComponent className="w-3.5 h-3.5 text-rose-400/90 group-hover:text-rose-400 shrink-0" />
                    <span>{sug}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Bar */}
            <div className="pt-1">
              <div className="relative flex items-center bg-[#15151B] border border-neutral-800/90 focus-within:border-neutral-700 rounded-full px-4 py-1.5 transition shadow-inner">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask Billu about logic, edge cases, dry runs, or intuition..."
                  disabled={loading}
                  className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 py-1.5 pr-3 font-sans"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={loading || !input.trim()}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shrink-0 shadow-[0_0_12px_rgba(244,63,94,0.35)] active:scale-95"
                  title="Send query"
                >
                  <Send className="w-3.5 h-3.5 -translate-x-[0.5px] -translate-y-[0.5px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
