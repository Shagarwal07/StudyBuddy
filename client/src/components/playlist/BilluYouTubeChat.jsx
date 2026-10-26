import { useState, useEffect, useRef } from "react";
import {
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  Clock,
  ExternalLink,
  Zap,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import formatTime from "../../utils/formatTime";
import MarkdownContent from "../common/MarkdownContent";

export default function BilluYouTubeChat({ video, playlist, player }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "Explain what was just discussed in simple terms",
    "What are the core takeaways from this section?",
    "Give an intuitive real-world example",
  ]);
  const [partialPopup, setPartialPopup] = useState(null);
  const [isWaitingFull, setIsWaitingFull] = useState(false);
  const [pollProgress, setPollProgress] = useState(10);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const videoId = video?._id || video?.ytVideoId || "";

  // Helper to get current playback timestamp formatted
  const getCurrentPlaybackTime = () => {
    if (!player || typeof player.getCurrentTime !== "function") return null;
    try {
      const seconds = Math.floor(player.getCurrentTime());
      return {
        seconds,
        formatted: formatTime(seconds),
      };
    } catch {
      return null;
    }
  };

  // Reset or initialize greeting when current video changes
  useEffect(() => {
    if (!video?.title) return;

    const initialGreeting = {
      role: "assistant",
      text: `Hello. I am here to help you understand "${video.title}". You can ask any doubt, request concept breakdowns, or ask about specific moments in this lecture.`,
    };

    setMessages([initialGreeting]);
    setInput("");
    setPartialPopup(null);
    setIsWaitingFull(false);

    const ytVideoId = video?.ytVideoId || video?.videoId || videoId;
    if (ytVideoId) {
      api
        .post("/ai/youtube-suggest", {
          ytVideoId,
          playhead: 0,
          youtubeContext: {
            timestamp: "00:00",
            timestampSeconds: 0,
            videoTitle: video.title,
            ytVideoId,
          },
        })
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.suggestions) && res.data.suggestions.length > 0) {
            setSuggestions(res.data.suggestions);
          }
        })
        .catch(() => {
          setSuggestions([
            "Explain what was just discussed in simple terms",
            "What are the core takeaways from this section?",
            "Give an intuitive real-world example",
          ]);
        });
    } else {
      setSuggestions([
        "Explain what was just discussed in simple terms",
        "What are the core takeaways from this section?",
        "Give an intuitive real-world example",
      ]);
    }
  }, [videoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend, explicitMode = null) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const playhead = getCurrentPlaybackTime();
    const userMessage = {
      role: "user",
      text: query,
      timestamp: playhead?.formatted || null,
    };

    // Prevent duplicating user bubble if executing an explicit mode retry for the same question
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (explicitMode && last?.role === "user" && last?.text === query) {
        return prev;
      }
      return [...prev, userMessage];
    });

    if (!explicitMode) {
      setInput("");
    }
    setLoading(true);

    const currentSeconds =
      player && typeof player.getCurrentTime === "function"
        ? Math.floor(player.getCurrentTime())
        : playhead?.seconds || 0;

    const ytVideoId = video?.ytVideoId || video?.videoId || videoId;

    const youtubeContext = {
      timestamp: playhead?.formatted || "00:00",
      timestampSeconds: currentSeconds,
      videoTitle: video?.title || "Lecture",
      ytVideoId,
    };

    // If waiting for full, poll embedding progress in background
    let pollInterval = null;
    if (explicitMode === "WAIT_FULL") {
      setIsWaitingFull(true);
      setPollProgress(10);
      pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/ai/youtube-embedding-status/${ytVideoId}`);
          if (statusRes.data?.embeddingProgress !== undefined) {
            setPollProgress(statusRes.data.embeddingProgress);
          }
        } catch {
          // Ignore polling errors
        }
      }, 2500);
    }

    try {
      const payload = {
        message: query,
        history: messages.slice(-6).map((m) => ({
          role: m.role === "assistant" || m.role === "model" ? "assistant" : "user",
          content: m.text || m.content || "",
        })),
        youtubeContext,
      };

      if (explicitMode) {
        payload.mode = explicitMode;
      }

      const res = await api.post("/ai/youtube-chat", payload);

      if (res.data?.success) {
        if (res.data.type === "PARTIAL_READY") {
          // 10% partial popup triggered
          setPartialPopup({
            title: res.data.popup?.title || "AI indexing 10%",
            body: res.data.popup?.body || "Instant answer from 10% or wait 60s for full?",
            progress: res.data.progress || 10,
            partialChunks: res.data.partialChunks || 0,
            query,
          });
        } else if (res.data.reply) {
          setMessages((prev) => [...prev, { role: "assistant", text: res.data.reply }]);
        }
      } else {
        toast.error("Failed to receive response from Billu AI.");
      }
    } catch (err) {
      console.error("[BilluYouTubeChat] Chat error:", err.message);
      toast.error(err.response?.data?.message || "Could not connect to Billu AI.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "An error occurred while connecting to the tutor service. Please try again shortly.",
        },
      ]);
    } finally {
      if (pollInterval) clearInterval(pollInterval);
      setIsWaitingFull(false);
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleInstantAnswer = () => {
    if (!partialPopup) return;
    const query = partialPopup.query;
    setPartialPopup(null);
    handleSendMessage(query, "INSTANT");
  };

  const handleWaitFull = () => {
    if (!partialPopup) return;
    const query = partialPopup.query;
    setPartialPopup(null);
    handleSendMessage(query, "WAIT_FULL");
  };

  const handleFetchDynamicSuggestions = async () => {
    if (loadingSuggestions) return;

    const playhead = getCurrentPlaybackTime();
    const currentSeconds =
      player && typeof player.getCurrentTime === "function"
        ? Math.floor(player.getCurrentTime())
        : playhead?.seconds || 0;

    const ytVideoId = video?.ytVideoId || video?.videoId || videoId;

    const youtubeContext = {
      timestamp: playhead?.formatted || "00:00",
      timestampSeconds: currentSeconds,
      videoTitle: video?.title || "Lecture",
      ytVideoId,
    };

    try {
      setLoadingSuggestions(true);
      const res = await api.post("/ai/youtube-suggest", {
        ytVideoId,
        playhead: currentSeconds,
        youtubeContext,
        history: messages.slice(-4),
      });

      if (res.data?.success && Array.isArray(res.data.suggestions) && res.data.suggestions.length > 0) {
        setSuggestions(res.data.suggestions);
        toast.success("Suggestions updated based on lecture.");
      }
    } catch (err) {
      console.error("[BilluYouTubeChat] Suggestion error:", err.message);
      toast.error("Could not refresh suggestions.");
    } finally {
      setLoadingSuggestions(false);
    }
  };



  const currentTime = getCurrentPlaybackTime();

  return (
    <div className="flex flex-col h-full bg-[#0E0E12] select-text overflow-hidden">
      {/* YouTube Lecture Context Strip */}
      <div className="h-9 bg-[#121215] border-b border-neutral-800 px-3 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-[11px] font-medium text-neutral-300 truncate">
            {video?.title || "Lecture Tutor"}
          </span>
        </div>

        {currentTime && (
          <button
            type="button"
            onClick={() => {
              setInput((prev) =>
                prev ? `[${currentTime.formatted}] ${prev}` : `Explain what the speaker meant at ${currentTime.formatted}: `
              );
              inputRef.current?.focus();
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
            title="Insert current timestamp into question"
          >
            <Clock className="w-2.5 h-2.5 text-red-400" />
            <span>{currentTime.formatted}</span>
          </button>
        )}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs text-neutral-300 leading-relaxed font-sans">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-neutral-500 select-none">
                <span>{isUser ? "You" : "Billu AI Tutor"}</span>
                {msg.timestamp && (
                  <span className="px-1 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                    {msg.timestamp}
                  </span>
                )}
              </div>

              <div
                className={`max-w-[95%] rounded-xl px-3 py-2 text-xs leading-relaxed transition ${
                  isUser
                    ? "bg-red-500/15 border border-red-500/30 text-neutral-100"
                    : "bg-neutral-900/90 border border-neutral-800 text-neutral-200 shadow-sm"
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
          <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px] py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
            <span>
              {isWaitingFull
                ? `Indexing full lecture (${pollProgress}%)... generating deep answer`
                : "Analyzing YouTube lecture context..."}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 10% Partial Indexing Modal */}
      {partialPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#131318] border border-neutral-700/80 rounded-2xl p-5 shadow-2xl shadow-red-950/30 flex flex-col space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    {partialPopup.title || "AI Indexing 10%"}
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {partialPopup.partialChunks ? `${partialPopup.partialChunks} lecture chunks indexed` : "Initial chunks ready"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPartialPopup(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="bg-neutral-900/90 border border-neutral-800/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium">Lecture Index Progress</span>
                <span className="text-red-400 font-mono font-bold">{partialPopup.progress || 10}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${partialPopup.progress || 10}%` }}
                />
              </div>
              <p className="text-[11.5px] text-neutral-300 leading-normal">
                {partialPopup.body || "Instant answer from 10% or wait 60s for full?"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleInstantAnswer}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-white text-xs font-semibold shadow-sm transition hover:scale-[1.02] cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Instant Answer</span>
              </button>

              <button
                type="button"
                onClick={handleWaitFull}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-semibold shadow-md shadow-red-950/40 transition hover:scale-[1.02] cursor-pointer"
              >
                <Clock className="w-4 h-4 text-white shrink-0" />
                <span>Wait for Full (~60s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Suggestions */}
      <div className="p-2.5 border-t border-neutral-800/80 bg-[#121215] shrink-0 space-y-2 select-none">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
          <span>Lecture Questions:</span>
          <button
            type="button"
            onClick={handleFetchDynamicSuggestions}
            disabled={loadingSuggestions}
            className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Refresh questions based on current topic"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${loadingSuggestions ? "animate-spin" : ""}`} />
            <span>Want suggestion?</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((sug, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => handleSendMessage(sug)}
              disabled={loading}
              className="text-left text-[10.5px] px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800/90 transition cursor-pointer disabled:opacity-50"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-1.5 pt-1">
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
            placeholder="Ask doubt, request analogy, or analyze this lecture..."
            disabled={loading}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-red-500/80 transition"
          />
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition cursor-pointer shrink-0"
            title="Send query"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
