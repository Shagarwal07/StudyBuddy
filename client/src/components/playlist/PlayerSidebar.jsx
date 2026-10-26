import { useState, useEffect, useRef, useCallback } from "react";
import { ListOrdered, BookOpen, Play, Copy, X, Loader2, Cpu, Check, Layers, Sparkles, ChevronDown, ChevronUp, FileText } from "lucide-react";
import toast from "react-hot-toast";
import QueueVideoCard from "./QueueVideoCard";
import BilluYouTubeChat from "./BilluYouTubeChat";
import formatTime from "../../utils/formatTime";
import api from "../../api/axios";
import NoteRenderer from "../notes/NoteRenderer";

export default function PlayerSidebar({
  videos = [],
  playlist,
  currentVideo,
  currentIndex = 0,
  player,
  onVideoSelect,
  activeTab = "queue",
  onTabChange,
  onVideoUpdated,
}) {
  const activeItemRef = useRef(null);

  // Global Knowledge Cache Study Guide state
  const [studyGuide, setStudyGuide] = useState(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [generatingModuleIndex, setGeneratingModuleIndex] = useState(null);
  const [expandedChapterIndex, setExpandedChapterIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll active video into view in Queue tab
  useEffect(() => {
    if (activeTab === "queue" && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentIndex, activeTab]);

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
      console.warn("[PlayerSidebar] Guide cache check:", err.message);
      setStudyGuide(null);
    } finally {
      setLoadingGuide(false);
    }
  }, []);

  useEffect(() => {
    if (currentVideo?.ytVideoId) {
      fetchGlobalGuide(currentVideo.ytVideoId);
    }
  }, [currentVideo?.ytVideoId, fetchGlobalGuide]);

  // 2. Synthesize Study Guide if not cached
  const handleGenerateGuide = async () => {
    const ytId = currentVideo?.ytVideoId;
    if (!ytId || generatingGuide) return;

    try {
      setGeneratingGuide(true);
      const res = await api.post(`/videos/guide/${ytId}`, {
        videoTitle: currentVideo.title,
        durationInSeconds: currentVideo.durationInSeconds,
        description: currentVideo.description || "",
      });

      if (res.data?.guide) {
        setStudyGuide(res.data.guide);
        if (onVideoUpdated && res.data.guide.fullMarkdownGuide) {
          onVideoUpdated({ ...currentVideo, notes: res.data.guide.fullMarkdownGuide });
        }
        toast.success(
          res.data.fromCache
            ? "Study guide loaded instantly from cache!"
            : "Master study guide synthesized by Billu AI!"
        );
      }
    } catch (err) {
      console.error("[PlayerSidebar:Generate Guide]", err.message);
      toast.error(err.response?.data?.message || "Failed to synthesize study guide.");
    } finally {
      setGeneratingGuide(false);
    }
  };

  // Synthesize single chapter notes directly from player sidebar
  const handleGenerateModule = async (moduleIndex) => {
    const ytId = currentVideo?.ytVideoId;
    if (!ytId || generatingModuleIndex !== null) return;

    try {
      setGeneratingModuleIndex(moduleIndex);
      const res = await api.post(`/videos/guide/${ytId}/module/${moduleIndex}`);

      if (res.data?.guide) {
        setStudyGuide(res.data.guide);
        if (onVideoUpdated && res.data.guide.fullMarkdownGuide) {
          onVideoUpdated({ ...currentVideo, notes: res.data.guide.fullMarkdownGuide });
        }
        toast.success(`Chapter ${moduleIndex + 1} notes synthesized!`);
      }
    } catch (err) {
      console.error("[PlayerSidebar:Generate Module]", err.message);
      toast.error(err.response?.data?.message || `Failed to synthesize Chapter ${moduleIndex + 1}.`);
    } finally {
      setGeneratingModuleIndex(null);
    }
  };

  // Seek video player to timestamp
  const handleSeek = (timestamp) => {
    if (player && typeof player.seekTo === "function") {
      player.seekTo(timestamp, true);
      toast.success(`Jumped to ${formatTime(timestamp)}`);
    }
  };

  const handleCopyMarkdown = () => {
    if (!studyGuide?.fullMarkdownGuide) return;
    navigator.clipboard.writeText(studyGuide.fullMarkdownGuide);
    setCopied(true);
    toast.success("Study guide copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 border border-slate-200 dark:border-neutral-800/80 bg-white dark:bg-[#0B0C10] rounded-2xl overflow-hidden flex flex-col h-[520px] lg:h-[calc(100vh-140px)] max-h-[850px] shadow-xl shadow-black/5 dark:shadow-black/60 transition-colors">
      {/* Tab Navigation Header */}
      <div className="p-2 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/80 dark:bg-neutral-900/40 shrink-0">
        <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-200/60 dark:bg-neutral-950 rounded-xl">
          <button
            type="button"
            onClick={() => onTabChange("queue")}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "queue"
                ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs dark:shadow-none"
                : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Queue</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 shrink-0">
              {currentIndex + 1}/{videos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("notes")}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "notes"
                ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs dark:shadow-none"
                : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Guide</span>
            {studyGuide?.roadmap?.length > 0 && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-red-500/15 text-red-500 dark:text-red-400 font-bold shrink-0">
                {studyGuide.roadmap.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("billu")}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "billu"
                ? "bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/30 shadow-xs"
                : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-red-400" />
            <span className="truncate">Billu AI</span>
          </button>
        </div>
      </div>

      {/* TAB 1: COURSE QUEUE */}
      {activeTab === "queue" && (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 overscroll-contain">
          {videos.map((video, index) => {
            const isActive = video._id === currentVideo?._id;
            return (
              <div key={video._id} ref={isActive ? activeItemRef : null}>
                <QueueVideoCard
                  video={video}
                  index={index}
                  isActive={isActive}
                  onVideoSelect={onVideoSelect}
                  onNotesClick={() => onTabChange("notes")}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: AI STUDY GUIDE & ROADMAP (Instant Cache) */}
      {activeTab === "notes" && (
        <div className="flex-1 overflow-y-auto flex flex-col p-3 space-y-3 overscroll-contain">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between px-1 shrink-0 pb-1 border-b border-slate-100 dark:border-neutral-850">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-red-500" />
                Roadmap Chapters
              </span>
              {studyGuide && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                  Cached
                </span>
              )}
            </div>

            {studyGuide && (
              <button
                type="button"
                onClick={handleCopyMarkdown}
                title="Copy full study manual to clipboard"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-[10px] font-medium text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copy Guide</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 space-y-2 min-h-0">
            {loadingGuide ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-neutral-500">
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                <span className="text-xs font-mono">Checking global knowledge cache...</span>
              </div>
            ) : !studyGuide ? (
              <div className="py-10 px-4 text-center rounded-xl bg-slate-50 dark:bg-neutral-900/30 border border-dashed border-slate-200 dark:border-neutral-800 space-y-2">
                <BookOpen className="w-6 h-6 text-slate-400 dark:text-neutral-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
                  No Study Guide Yet
                </p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 leading-relaxed">
                  Billu AI can scan this lecture and create a complete textbook roadmap with clickable chapters and technical manuals.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateGuide}
                  disabled={generatingGuide}
                  className="mt-1 px-3 py-1.5 bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {generatingGuide ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Generate Study Guide</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {studyGuide.executiveOverview && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-neutral-900/40 border border-slate-200 dark:border-neutral-800/80">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-1">
                      Overview
                    </span>
                    <p className="text-[11px] text-slate-700 dark:text-neutral-300 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                      {studyGuide.executiveOverview}
                    </p>
                  </div>
                )}

                {/* Chapter Roadmap Progress & List */}
                {/* Chapter Roadmap Progress & List */}
                <div className="space-y-2.5">
                  {(() => {
                    const totalCount = studyGuide.roadmap?.length || 0;
                    const readyCount =
                      studyGuide.roadmap?.filter(
                        (m) =>
                          studyGuide.cachedModuleIndices?.includes(m.index) ||
                          Boolean(studyGuide.modulesMap?.[String(m.index)]?.markdownContent)
                      ).length || 0;
                    const pct = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

                    return (
                      <div className="space-y-1.5 px-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-neutral-300">
                            Course Roadmap
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-neutral-400 font-bold bg-slate-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded-full border border-slate-200 dark:border-neutral-700/60">
                            {readyCount}/{totalCount} Ready ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-2">
                    {studyGuide.roadmap?.map((chapter) => {
                      const isSynthesized =
                        studyGuide.cachedModuleIndices?.includes(chapter.index) ||
                        Boolean(studyGuide.modulesMap?.[String(chapter.index)]?.markdownContent);
                      const moduleData =
                        studyGuide.modulesMap?.[String(chapter.index)] ||
                        studyGuide.modulesMap?.[chapter.index];
                      const isGeneratingThis = generatingModuleIndex === chapter.index;
                      const isExpanded = expandedChapterIndex === chapter.index;

                      // Properly format time range without 60+ minutes glitch
                      const timeRange =
                        chapter.startSeconds !== undefined && chapter.endSeconds !== undefined
                          ? `${formatTime(chapter.startSeconds)} - ${formatTime(chapter.endSeconds)}`
                          : chapter.timeFormatted || formatTime(chapter.startSeconds);

                      return (
                        <div
                          key={chapter.index}
                          className={`p-3 rounded-xl border transition-all flex flex-col gap-2.5 group ${
                            isExpanded
                              ? "bg-neutral-900 border-neutral-700 shadow-lg shadow-black/50"
                              : "bg-neutral-900/40 hover:bg-neutral-900/80 border-neutral-800/80 hover:border-neutral-700/80 hover:shadow-md"
                          }`}
                        >
                          {/* Main Row */}
                          <div className="flex items-center justify-between gap-3 w-full">
                            {/* Left: Spotify-style track number / play hover button */}
                            <button
                              type="button"
                              onClick={() => handleSeek(chapter.startSeconds)}
                              title={`Jump to ${timeRange}`}
                              className="relative w-8 h-8 rounded-full bg-neutral-800/80 border border-neutral-700/60 hover:border-red-500/60 hover:bg-red-500/15 flex items-center justify-center transition-all cursor-pointer shrink-0 group/play shadow-xs"
                            >
                              <span className="text-[11px] font-mono font-bold text-neutral-400 group-hover/play:hidden select-none">
                                {String(chapter.index + 1).padStart(2, "0")}
                              </span>
                              <Play className="w-3.5 h-3.5 fill-current text-red-400 hidden group-hover/play:block ml-0.5" />
                            </button>

                            {/* Middle: Title & Compact Metadata Row */}
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs sm:text-[13px] font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                                {chapter.title}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-400 font-mono">
                                <span className="text-neutral-400">{timeRange}</span>
                                {chapter.overview && (
                                  <>
                                    <span className="text-neutral-600 font-sans">•</span>
                                    <span className="text-neutral-400 font-sans truncate line-clamp-1 max-w-[220px]">
                                      {chapter.overview}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Right: Modern Pill Action */}
                            <div className="shrink-0">
                              {isSynthesized ? (
                                <button
                                  type="button"
                                  onClick={() => setExpandedChapterIndex(isExpanded ? null : chapter.index)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                                    isExpanded
                                      ? "bg-red-500/15 text-red-400 border-red-500/30"
                                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/25 hover:border-emerald-500/40"
                                  }`}
                                  title={isExpanded ? "Collapse notes" : "Read chapter notes"}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isExpanded ? "bg-red-400" : "bg-emerald-400 animate-pulse"
                                    }`}
                                  />
                                  <span>{isExpanded ? "Hide" : "Notes"}</span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3 text-red-400" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 text-emerald-400" />
                                  )}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateModule(chapter.index)}
                                  disabled={generatingModuleIndex !== null}
                                  title="Synthesize notes for this chapter"
                                  className="px-3 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-500/30 hover:border-red-500/50 shrink-0 inline-flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                                >
                                  {isGeneratingThis ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                                      <span>Generating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3 text-red-400" />
                                      <span>Generate</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline Notes Preview */}
                          {isExpanded && (
                            <div className="w-full mt-1.5 pt-2.5 border-t border-slate-200 dark:border-neutral-800/80 bg-slate-50/80 dark:bg-neutral-950/80 p-3 rounded-xl border border-slate-200/80 dark:border-neutral-800/60 overflow-hidden">
                              <NoteRenderer
                                content={
                                  moduleData?.markdownContent ||
                                  `## Overview\n\n${chapter.overview || "Chapter notes synthesized and ready."}`
                                }
                                onSeekTimestamp={handleSeek}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BILLU AI UNIVERSAL YOUTUBE TUTOR */}
      {activeTab === "billu" && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <BilluYouTubeChat
            video={currentVideo}
            playlist={playlist}
            player={player}
          />
        </div>
      )}
    </aside>
  );
}
