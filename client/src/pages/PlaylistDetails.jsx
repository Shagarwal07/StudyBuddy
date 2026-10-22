import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Search, FileText, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import AppShell from "../components/layout/AppShell";
import NotesModal from "../components/modals/NotesModal";
import Loader from "../components/common/Loader";
import VideoRow from "../components/playlist/VideoRow.jsx";
import { saveRecentPlaylist } from "../utils/recentNavigation";
import formatTime from "../utils/formatTime";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";

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
    [navigate, playlist?._id]
  );

  const handleToggleComplete = async (videoId, currentStatus) => {
    try {
      const response = await api.patch(`/videos/${videoId}`, {
        completed: !currentStatus,
      });

      const updatedVideo = response.data.video;
      setVideos((prev) =>
        prev.map((video) => (video._id === videoId ? updatedVideo : video))
      );
    } catch (error) {
      console.error(
        "[PlaylistDetails] Toggle Complete Error:",
        error.message || error
      );
    }
  };

  const {
    completedCount,
    progress,
    totalRemainingHours,
    nextVideo,
    nextIndex,
    notesCount,
  } = useMemo(() => {
    let completed = 0;
    let remainingSeconds = 0;
    let firstUncompleted = null;
    let totalNotes = 0;

    for (const v of videos) {
      if (v.completed) {
        completed++;
      } else {
        if (!firstUncompleted) firstUncompleted = v;
        const duration = Math.max(0, Number(v.durationInSeconds) || 0);
        const watched = Math.min(duration, Math.max(0, Number(v.watchedSeconds) || 0));
        remainingSeconds += duration - watched;
      }
      if (v.notes?.trim() || v.hasStudyGuide) {
        totalNotes++;
      }
    }

    const total = videos.length;
    const targetNext = firstUncompleted || videos[0] || null;
    const targetIdx = targetNext
      ? videos.findIndex((v) => v._id === targetNext._id)
      : 0;

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
        text="Loading Course Details..."
        subtitle="Fetching lessons and outline."
        fullscreen
      />
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-[#080407] text-white flex items-center justify-center font-sans">
        Playlist not found
      </div>
    );
  }

  return (
    <AppShell showBack={false} title={playlist.title || "Playlist"}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-7">
        
        {/* Top Breadcrumb Navigation */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/youtube")}
            className="px-3 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <span className="text-xs font-mono text-neutral-400 truncate">
            Ad-free Video / {playlist.title}
          </span>
        </div>

        {/* Course Header Banner: Matching reference layout with text on left & tilt slide image on right */}
        <section data-theme="dark" className="dark-surface relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#140b0e] via-[#10090c] to-[#0a0608] border border-neutral-800/90 p-6 sm:p-8 lg:p-10 shadow-2xl">
          {/* Subtle Ambient Red Glow */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 items-center">
            {/* Left Column: Category, Title, Subtitle, Progress, and Action Buttons */}
            <div className="space-y-4">
              <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-red-500 uppercase block">
                {videos.length === 1 ? "SINGLE VIDEO" : "CONTINUE WATCHING"}
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight line-clamp-2">
                {playlist.title}
              </h1>

              <p className="text-xs sm:text-sm font-medium text-neutral-300 line-clamp-1">
                {nextVideo
                  ? `Lecture ${nextIndex + 1} : ${nextVideo.title}`
                  : playlist.channelTitle
                  ? `Course by ${playlist.channelTitle}`
                  : "Curated learning track"}
              </p>

              {/* Progress Bar & Status (matching reference) */}
              <div className="space-y-1.5 pt-1 max-w-md">
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>{progress}% watched</span>
                  <span>
                    {nextVideo?.watchedSeconds
                      ? `Resume at ${formatTime(nextVideo.watchedSeconds)}`
                      : `${completedCount} of ${videos.length} completed • ${totalRemainingHours} hrs left`}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Preserving exact button names */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {nextVideo && (
                  <button
                    type="button"
                    onClick={() => openVideo(nextVideo._id)}
                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-black text-black" />
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
                      const firstWithNotes = videos.find((v) =>
                        Boolean(v.notes?.trim())
                      );
                      if (firstWithNotes) handleNotesClick(firstWithNotes);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white font-semibold text-xs sm:text-sm border border-neutral-700/80 transition cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Study Guides ({notesCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Tilt Slide Image with Centered Frosted Play Button */}
            <div className="w-full flex items-center justify-center lg:justify-end">
              <div
                onClick={() => nextVideo && openVideo(nextVideo._id)}
                className="w-full max-w-md lg:max-w-none aspect-video rounded-2xl overflow-hidden border border-neutral-800/80 relative group cursor-pointer shadow-2xl bg-neutral-950 transform lg:-rotate-2 hover:rotate-0 hover:scale-[1.02] transition-all duration-300 ease-out"
                style={{ transformOrigin: "center right" }}
              >
                <img
                  key={playlist?._id || nextVideo?._id || "hero-thumb"}
                  src={
                    playlist?.thumbnailUrl ||
                    nextVideo?.thumbnailUrl ||
                    videos[0]?.thumbnailUrl ||
                    FALLBACK_THUMBNAIL
                  }
                  alt={playlist.title}
                  className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_THUMBNAIL;
                  }}
                />

                {/* Centered Play Button */}
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition duration-300">
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-black text-black translate-x-0.5" />
                  </div>
                </div>

                {/* Bottom Red Accent Strip */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/70 z-10">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${Math.max(8, progress)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Outline Section */}
        <section className="space-y-4">
          {/* Header Row: Title on Left, Tabs & Search on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Course outline
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-xs">
                {videos.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-medium select-none">
                <button
                  type="button"
                  onClick={() => setFilterStatus("all")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterStatus === "all"
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  All ({videos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("remaining")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterStatus === "remaining"
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Remaining ({videos.length - completedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus("completed")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterStatus === "completed"
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Completed ({completedCount})
                </button>
              </div>

              {/* Search Inside Course */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter lessons"
                  className="w-40 sm:w-48 bg-[#0e0a0d] border border-neutral-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Table Column Labels */}
          <div className="flex items-center justify-between px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 select-none">
            <div className="flex items-center gap-4">
              <span className="w-6 text-center">#</span>
              <span>TITLE & PREVIEW</span>
            </div>
            <div className="flex items-center gap-12 pr-4">
              <span>NOTES</span>
              <span className="w-16 text-right">DURATION</span>
            </div>
          </div>

          {/* Lessons List */}
          {filteredVideos.length === 0 ? (
            <div className="py-12 text-center bg-[#0d090c] border border-neutral-800/80 rounded-2xl space-y-2">
              <p className="text-xs text-neutral-400">
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
                  className="text-xs text-red-500 hover:text-red-400 font-medium transition cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredVideos.map((video) => {
                const originalIndex = videos.findIndex(
                  (v) => v._id === video._id
                );
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
            prev.map((v) => (v._id === updatedVideo._id ? updatedVideo : v))
          )
        }
      />
    </AppShell>
  );
}
