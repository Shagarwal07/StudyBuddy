import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const [showFullDescription, setShowFullDescription] = useState(false);

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

  const { completedCount, progress, totalRemainingHours } = useMemo(() => {
    let completed = 0;
    let remainingSeconds = 0;
    for (const v of videos) {
      if (v.completed) completed++;
      remainingSeconds += (v.durationInSeconds || 0) - (v.watchedSeconds || 0);
    }
    const total = videos.length;
    return {
      completedCount: completed,
      progress: total ? Math.round((completed / total) * 100) : 0,
      totalRemainingHours: (Math.max(0, remainingSeconds) / 3600).toFixed(1),
    };
  }, [videos]);

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
      <div className="min-h-screen bg-[#030005] text-white flex items-center justify-center font-sans">
        Playlist not found
      </div>
    );
  }

  return (
    <AppShell showBack title={playlist.title || "Playlist"}>
      <div className="w-full max-w-6xl mx-auto px-5 pb-6 font-sans">
        <section className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-80 aspect-video rounded-xl overflow-hidden shrink-0">
              <img
                src={playlist.thumbnailUrl}
                alt={playlist.title}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-3">{playlist.title}</h1>

              <div className="mb-4">
                <p
                  className={`text-sm text-neutral-400 ${showFullDescription ? "" : "line-clamp-4"}`}
                >
                  {playlist.description}
                </p>

                {playlist.description?.length > 300 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDescription((prev) => !prev)}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    {showFullDescription ? "See Less" : "See More"}
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center text-sm text-neutral-500 mb-3">
                <span>
                  {completedCount}/{videos.length} completed
                </span>
                <span>{totalRemainingHours} hrs left</span>
              </div>

              <div className="w-full h-2 rounded-full bg-neutral-800 border border-neutral-700/50 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Videos</h2>

          <div className="space-y-3">
            {videos.map((video, index) => (
              <VideoRow
                key={video._id}
                video={video}
                index={index}
                onVideoClick={openVideo}
                onToggleComplete={handleToggleComplete}
                onNotesClick={handleNotesClick}
              />
            ))}
          </div>
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
