import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Clock,
  Play,
  X,
  Loader2,
  Cpu,
  Copy,
  BookOpen,
  Layers,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowRight,
} from "lucide-react";
import api from "../../api/axios";
import formatTime from "../../utils/formatTime";
import NoteRenderer from "../notes/NoteRenderer";

export default function NotesModal({
  isOpen,
  onClose,
  video,
  player,
  onSeekTimestamp,
  onNotesSaved,
}) {
  const [activeTab, setActiveTab] = useState("roadmap"); // 'roadmap' | 'fullguide'
  const [studyGuide, setStudyGuide] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [generatingModuleIndex, setGeneratingModuleIndex] = useState(null);
  const [expandedModuleIndex, setExpandedModuleIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  // 1. Instant Cache Hookup: Query global knowledge cache (<50ms)
  const fetchGlobalGuide = useCallback(async (ytId) => {
    if (!ytId) return;

    try {
      setLoadingGuide(true);
      const res = await api.get(`/videos/guide/${ytId}`);
      if (res.data?.guide) {
        setStudyGuide(res.data.guide);
      } else {
        setStudyGuide(null);
      }
    } catch (err) {
      console.warn("[NotesModal] Cache fetch notice:", err.message);
      setStudyGuide(null);
    } finally {
      setLoadingGuide(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && video?.ytVideoId) {
      fetchGlobalGuide(video.ytVideoId);
    }
  }, [isOpen, video?.ytVideoId, fetchGlobalGuide]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !generatingGuide) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, generatingGuide, onClose]);

  if (!isOpen || !video) return null;

  // 2. Synthesize Study Guide if not cached
  const handleGenerateStudyGuide = async () => {
    const ytId = video?.ytVideoId;
    if (!ytId || generatingGuide) return;

    try {
      setGeneratingGuide(true);
      const res = await api.post(`/videos/guide/${ytId}`, {
        videoTitle: video.title,
        durationInSeconds: video.durationInSeconds,
        description: video.description || "",
      });

      if (res.data?.guide) {
        setStudyGuide(res.data.guide);
        if (onNotesSaved) {
          onNotesSaved({ ...video, notes: res.data.guide.fullMarkdownGuide });
        }
        toast.success(
          res.data.fromCache
            ? "Master study guide loaded instantly from cache!"
            : "Master study guide synthesized by Billu AI!"
        );
      }
    } catch (err) {
      console.error("[Generate Guide Error]", err.message);
      toast.error(err.response?.data?.message || "Failed to synthesize study guide.");
    } finally {
      setGeneratingGuide(false);
    }
  };

  // 3. Synthesize specific chapter notes on demand
  const handleGenerateModule = async (moduleIndex) => {
    const ytId = video?.ytVideoId;
    if (!ytId || generatingModuleIndex !== null) return;

    try {
      setGeneratingModuleIndex(moduleIndex);
      const res = await api.post(`/videos/guide/${ytId}/module/${moduleIndex}`);

      if (res.data?.guide) {
        setStudyGuide(res.data.guide);
        if (onNotesSaved && res.data.guide.fullMarkdownGuide) {
          onNotesSaved({ ...video, notes: res.data.guide.fullMarkdownGuide });
        }
        setExpandedModuleIndex(moduleIndex);
        toast.success(`Chapter ${moduleIndex + 1} notes synthesized!`);
      }
    } catch (err) {
      console.error("[Generate Chapter Error]", err.message);
      toast.error(err.response?.data?.message || `Failed to synthesize Chapter ${moduleIndex + 1}.`);
    } finally {
      setGeneratingModuleIndex(null);
    }
  };

  const getNextPendingChapter = () => {
    if (!studyGuide?.roadmap) return null;
    return studyGuide.roadmap.find(
      (m) =>
        !studyGuide.cachedModuleIndices?.includes(m.index) &&
        !studyGuide.modulesMap?.[String(m.index)]?.markdownContent
    );
  };

  const handleJumpTo = (seconds) => {
    if (onSeekTimestamp) {
      onSeekTimestamp(seconds);
    }
    toast.success(`Jumped to ${formatTime(seconds)}`);
  };

  const handleCopyMarkdown = () => {
    if (!studyGuide?.fullMarkdownGuide) return;
    navigator.clipboard.writeText(studyGuide.fullMarkdownGuide);
    setCopied(true);
    toast.success("Markdown copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-[#101014] p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4 mb-4">
          <div className="min-w-0 pr-4">
            <h2 className="text-base sm:text-lg font-bold text-neutral-100 truncate">
              {video.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <span>AI Master Study Guide</span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close notes modal"
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation & Primary Action Bar - Only shown once guide exists */}
        {studyGuide && (
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4 flex-wrap gap-2">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("roadmap")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "roadmap"
                    ? "bg-red-500/15 border border-red-500/30 text-red-400"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  Roadmap ({studyGuide.roadmap?.filter(m => studyGuide.cachedModuleIndices?.includes(m.index) || Boolean(studyGuide.modulesMap?.[String(m.index)]?.markdownContent)).length || 0}/{studyGuide.roadmap?.length || 0})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("fullguide")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === "fullguide"
                    ? "bg-red-500/15 border border-red-500/30 text-red-400"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Full Manual</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Next Chapter Action */}
              {activeTab === "roadmap" && (() => {
                const nextPending = getNextPendingChapter();
                if (!nextPending) return null;
                return (
                  <button
                    type="button"
                    onClick={() => handleGenerateModule(nextPending.index)}
                    disabled={generatingModuleIndex !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    {generatingModuleIndex === nextPending.index ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generating Ch {nextPending.index + 1}...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Next: Ch {nextPending.index + 1}</span>
                      </>
                    )}
                  </button>
                );
              })()}

              {studyGuide.fullMarkdownGuide && (
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  title="Copy complete markdown guide"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-medium text-neutral-300 hover:text-white transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto min-h-[300px] pr-1">
          {loadingGuide ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span className="text-xs font-mono">Checking global knowledge cache...</span>
            </div>
          ) : !studyGuide ? (
            <div className="py-16 px-6 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 flex flex-col items-center justify-center space-y-3">
              <Cpu className="w-8 h-8 text-neutral-600" />
              <h3 className="text-sm font-semibold text-neutral-200">
                No Master Study Guide Generated Yet
              </h3>
              <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
                Billu AI will analyze the entire video transcript and generate a textbook-grade
                study guide with comparative tables, execution flows, and roadmap timestamps.
              </p>
              <button
                type="button"
                onClick={handleGenerateStudyGuide}
                disabled={generatingGuide}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer shadow-lg shadow-red-500/20"
              >
                {generatingGuide ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Synthesizing Full Course...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>Generate Master Study Guide</span>
                  </>
                )}
              </button>
            </div>
          ) : activeTab === "roadmap" ? (
            /* Tab 1: Roadmap Chapters */
            <div className="space-y-2.5">
              {studyGuide.executiveOverview && (
                <div className="py-2.5 px-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800/60 mb-2">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {studyGuide.executiveOverview}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                {studyGuide.roadmap?.map((chapter) => {
                  const isSynthesized =
                    studyGuide.cachedModuleIndices?.includes(chapter.index) ||
                    Boolean(studyGuide.modulesMap?.[String(chapter.index)]?.markdownContent);
                  const moduleData =
                    studyGuide.modulesMap?.[String(chapter.index)] ||
                    studyGuide.modulesMap?.[chapter.index];
                  const isExpanded = expandedModuleIndex === chapter.index;
                  const isGeneratingThis = generatingModuleIndex === chapter.index;

                  return (
                    <div
                      key={chapter.index}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-colors flex flex-col gap-2 ${
                        isSynthesized
                          ? "border-neutral-800/80 bg-neutral-950/60 hover:border-neutral-700"
                          : "border-neutral-800/40 bg-neutral-950/20 hover:border-neutral-800"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleJumpTo(chapter.startSeconds)}
                            title={`Seek to ${chapter.timeFormatted || formatTime(chapter.startSeconds)}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-red-400 font-mono text-[11px] border border-neutral-800 transition cursor-pointer shrink-0"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>{chapter.timeFormatted || formatTime(chapter.startSeconds)}</span>
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-neutral-200 truncate">
                                {chapter.title}
                              </h4>
                              {isSynthesized && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Notes Ready" />
                              )}
                            </div>
                            {chapter.overview && (
                              <p className="text-[11px] text-neutral-500 truncate leading-snug">
                                {chapter.overview}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSynthesized ? (
                            <button
                              type="button"
                              onClick={() => setExpandedModuleIndex(isExpanded ? null : chapter.index)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-neutral-400" />
                              <span>{isExpanded ? "Hide" : "Notes"}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleGenerateModule(chapter.index)}
                              disabled={generatingModuleIndex !== null}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition cursor-pointer disabled:opacity-50"
                            >
                              {isGeneratingThis ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Generating...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" />
                                  <span>Generate</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Preview */}
                      {isExpanded && (
                        <div className="mt-1 pt-2.5 border-t border-neutral-800/60">
                          <div className="flex items-center justify-between pb-1.5 mb-2">
                            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                              Chapter {chapter.index + 1} Summary
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveTab("fullguide")}
                              className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-medium"
                            >
                              <span>Read in Manual</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="bg-neutral-950/80 p-3 rounded-lg border border-neutral-800/60 overflow-hidden">
                            <NoteRenderer
                              content={moduleData?.markdownContent || `## Overview\n\n${chapter.overview || "Chapter notes synthesized and ready."}`}
                              onSeekTimestamp={handleJumpTo}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tab 2: Full Study Manual (Rendered with NoteRenderer) */
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60">
              <NoteRenderer
                content={(studyGuide.fullMarkdownGuide || studyGuide.executiveOverview || "").replace(
                  /\[▶\s*([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?)\]/g,
                  (match, timeStr) => `[▶ ${timeStr}](#t=${timeStr})`
                ) || "No detailed manual available."}
                onSeekTimestamp={handleJumpTo}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
