import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Search, FileText, X } from "lucide-react";
import api from "../api/axios";
import AppShell from "../components/layout/AppShell";
import NotesModal from "../components/modals/NotesModal";
import Loader from "../components/common/Loader";
import VideoRow from "../components/playlist/VideoRow.jsx";
import { saveRecentPlaylist } from "../utils/recentNavigation";

export default function PlaylistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'remaining' | 'completed'

  const fetchPlaylist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/playlists/${id}`);
      setPlaylist(response.data.playlist);
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error("[PlaylistDetails] Fetch Error:", error.message || error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  useEffect(() => {
    if (!playlist) return;
    saveRecentPlaylist(playlist);
  }, [playlist]);

  const openVideo = useCallback(
    (videoId) => {
      navigate(`/playlist/${playlist?._id}/video/${videoId}`);
    },
    [navigate, playlist?._id],
  );

  const handleToggleComplete = async (videoId, currentStatus) => {
    try {
      const response = await api.patch(`/videos/${videoId}`, {
        completed: !currentStatus,
      });

      const updatedVideo = response.data.video;
      setVideos((prev) =>
        prev.map((video) => (video._id === videoId ? updatedVideo : video)),
      );
    } catch (error) {
      console.error(
        "[PlaylistDetails] Toggle Complete Error:",
        error.message || error,
      );
    }
  };

  const { completedCount, progress, totalRemainingHours, nextVideo, nextIndex, notesCount } = useMemo(() => {
    let completed = 0;
    let remainingSeconds = 0;
    let firstUncompleted = null;
    let totalNotes = 0;

    for (const v of videos) {
      if (v.completed) {
        completed++;
      } else if (!firstUncompleted) {
        firstUncompleted = v;
      }
      if (v.notes?.trim()) {
        totalNotes++;
      }
      remainingSeconds += (v.durationInSeconds || 0) - (v.watchedSeconds || 0);
    }

    const total = videos.length;
    const targetNext = firstUncompleted || videos[0] || null;
    const targetIdx = targetNext ? videos.findIndex((v) => v._id === targetNext._id) : 0;

    return {
      completedCount: completed,
      progress: total ? Math.round((completed / total) * 100) : 0,
      totalRemainingHours: (Math.max(0, remainingSeconds) / 3600).toFixed(1),
      nextVideo: targetNext,
      nextIndex: targetIdx >= 0 ? targetIdx : 0,
      notesCount: totalNotes,
    };
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (filterStatus === "remaining" && v.completed) return false;
      if (filterStatus === "completed" && !v.completed) return false;
      if (searchQuery.trim()) {
        return v.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [videos, filterStatus, searchQuery]);

  const handleNotesClick = useCallback((video) => {
    setSelectedVideo(video);
    setShowNotes(true);
  }, []);

  if (loading) {
    return (
      <Loader
        text="Loading Playlist..."
        subtitle="Fetching playlist details."
        fullscreen
      />
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-slate-900 dark:text-white flex items-center justify-center font-sans">
        Playlist not found
      </div>
    );
  }

  return (
    <AppShell showBack title={playlist.title || "Playlist"}>
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-16 font-sans space-y-7">
        {/* Spotify Album / Netflix Series Hero Banner */}
        <section className="relative overflow-hidden bg-white dark:bg-[#0c0d12] border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-7 shadow-xs dark:shadow-none transition-colors">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 bg-red-500/10 dark:bg-red-500/15 rounded-full blur-3xl opacity-70" />

          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-7 items-start">
            {/* Thumbnail with 16:9 poster styling */}
            <div
              onClick={() => nextVideo && openVideo(nextVideo._id)}
              className="w-full sm:w-64 md:w-80 aspect-video rounded-xl overflow-hidden shrink-0 relative group cursor-pointer bg-neutral-950 border border-slate-200 dark:border-neutral-800 shadow-md shadow-black/10 dark:shadow-black/50"
            >
              <img
                src={playlist.thumbnailUrl}
                alt={playlist.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60";
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transform transition-transform group-hover:scale-110">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>

              {/* Pinned Bottom Progress Strip */}
              {progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/70">
                  <div
                    className="h-full bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Info & Metadata Column */}
            <div className="flex-1 min-w-0 w-full flex flex-col justify-between self-stretch">
              <div>
                {/* Top Category / Author Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                    {videos.length === 1 ? "Single Video" : "Course Playlist"}
                  </span>
                  {playlist.channelTitle && (
                    <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                      by {playlist.channelTitle}
                    </span>
                  )}
                </div>

                {/* Display Title */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100 mb-4 leading-snug">
                  {playlist.title}
                </h1>
              </div>

              {/* Progress & Quick Stats */}
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 font-mono mb-2">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">
                    {completedCount} of {videos.length} completed
                  </span>
                  <span>•</span>
                  <span>{totalRemainingHours} hrs left</span>
                  <span>•</span>
                  <span className="text-red-500 dark:text-red-400 font-semibold">{progress}%</span>
                  {notesCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-500 font-medium">{notesCount} {notesCount === 1 ? "note" : "notes"}</span>
                    </>
                  )}
                </div>

                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-neutral-800/80 overflow-hidden mb-5">
                  <div
                    className="h-full bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Primary Action Button Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {nextVideo && (
                    <button
                      type="button"
                      onClick={() => openVideo(nextVideo._id)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>
                        {progress === 100
                          ? "Rewatch Course"
                          : progress > 0
                          ? `Resume Lesson ${nextIndex + 1}`
                          : "Start Lesson 1"}
                      </span>
                    </button>
                  )}

                  {notesCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const firstWithNotes = videos.find((v) => Boolean(v.notes?.trim()));
                        if (firstWithNotes) handleNotesClick(firstWithNotes);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs sm:text-sm font-medium border border-slate-200 dark:border-neutral-700 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      <span>Saved Notes ({notesCount})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Tracklist Section */}
        <section className="space-y-3.5">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-neutral-100 uppercase font-mono">
                Course Outline ({videos.length})
              </h2>
            </div>

            {/* Spotify-style search & filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Pills */}
              <div className="flex items-center bg-slate-100 dark:bg-neutral-900/80 p-0.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterStatus === "all"
                      ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs"
                      : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
                  }`}
                >
                  All ({videos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("remaining")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterStatus === "remaining"
                      ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs"
                      : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
                  }`}
                >
                  Remaining ({videos.length - completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("completed")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    filterStatus === "completed"
                      ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs"
                      : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200"
                  }`}
                >
                  Completed ({completedCount})
                </button>
              </div>

              {/* Search inside course */}
              {videos.length > 4 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter lessons..."
                    className="w-36 sm:w-44 bg-white dark:bg-[#0E0E12] border border-slate-200 dark:border-neutral-800 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 outline-none focus:border-red-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Table Column Headers */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4 px-3 sm:px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500 border-b border-slate-200 dark:border-neutral-800/80 select-none">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-8 sm:col-span-7 md:col-span-7">Title & Preview</div>
            <div className="hidden sm:block sm:col-span-2 md:col-span-2 text-center">Notes</div>
            <div className="col-span-3 sm:col-span-2 md:col-span-2 text-right">Duration</div>
          </div>

          {/* Episode List */}
          {filteredVideos.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-neutral-900/30 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-2">
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {searchQuery
                  ? `No lessons found matching "${searchQuery}"`
                  : "No lessons match this filter."}
              </p>
              {(searchQuery || filterStatus !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVideos.map((video) => {
                const originalIndex = videos.findIndex((v) => v._id === video._id);
                const isNext = video._id === nextVideo?._id;
                return (
                  <VideoRow
                    key={video._id}
                    video={video}
                    index={originalIndex >= 0 ? originalIndex : 0}
                    isNext={isNext}
                    onVideoClick={openVideo}
                    onToggleComplete={handleToggleComplete}
                    onNotesClick={handleNotesClick}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      <NotesModal
        isOpen={showNotes}
        video={selectedVideo}
        onClose={() => {
          setShowNotes(false);
          setSelectedVideo(null);
        }}
        onNotesSaved={(updatedVideo) =>
          setVideos((prev) =>
            prev.map((v) => (v._id === updatedVideo._id ? updatedVideo : v)),
          )
        }
      />
    </AppShell>
  );
}
