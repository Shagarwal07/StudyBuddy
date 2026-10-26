import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Tv } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import api from "../api/axios";
import Loader from "../components/common/Loader";
import VideoPlayer from "../components/playlist/VideoPlayer";
import PlayerInfoCard from "../components/playlist/PlayerInfoCard";
import PlayerSidebar from "../components/playlist/PlayerSidebar";
import {
  saveRecentPlayer,
  saveRecentPlaylist,
} from "../utils/recentNavigation";

export default function PlaylistPlayer() {
  const { playlistId, videoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const startTime = useMemo(
    () => Number(searchParams.get("start") || 0),
    [searchParams],
  );

  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("queue"); // 'queue' | 'notes'

  const currentVideo = useMemo(() => {
    return videos.find((video) => video._id === videoId) || videos[0];
  }, [videos, videoId]);

  const currentVideoRef = useRef(currentVideo);
  useEffect(() => {
    currentVideoRef.current = currentVideo;
  }, [currentVideo]);

  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    if (!playlist || !currentVideo) return;

    saveRecentPlaylist(playlist);
    saveRecentPlayer(playlist._id, currentVideo);
  }, [playlist?._id, currentVideo?._id]);

  const currentIndex = useMemo(() => {
    return videos.findIndex((v) => v._id === currentVideo?._id);
  }, [videos, currentVideo]);

  const fetchPlaylist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/playlists/${playlistId}`);
      setPlaylist(res.data.playlist);
      setVideos(res.data.videos || []);
    } catch (error) {
      console.error(
        "[PlaylistPlayer] Fetch Playlist Error:",
        error.message || error,
      );
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  // Reset player instance when videoId changes so previous player instance cannot be queried
  useEffect(() => {
    setPlayer(null);
  }, [videoId]);

  const saveProgress = useCallback(
    async (targetVideo, targetPlayer, force = false) => {
      const activeVideo = targetVideo || currentVideoRef.current;
      const activePlayer = targetPlayer || playerRef.current;
      if (!activePlayer || !activeVideo) return;

      // 1. YouTube video ID match verification to guarantee we NEVER save cross-video progress
      try {
        const ytData =
          typeof activePlayer.getVideoData === "function"
            ? activePlayer.getVideoData()
            : null;
        const activeYtId = ytData?.video_id;
        if (
          activeYtId &&
          activeVideo.ytVideoId &&
          activeYtId !== activeVideo.ytVideoId
        ) {
          return;
        }
      } catch (err) {
        console.warn("[PlaylistPlayer] Could not verify videoId from player:", err);
      }

      // 2. Only send periodic update if player is actively playing (state 1) unless forced
      if (
        !force &&
        typeof activePlayer.getPlayerState === "function" &&
        activePlayer.getPlayerState() !== 1
      ) {
        return;
      }

      try {
        const watchedSeconds = Math.floor(
          typeof activePlayer.getCurrentTime === "function"
            ? activePlayer.getCurrentTime()
            : 0,
        );

        // Preserve authoritative duration from database; only query player if DB duration is missing (0)
        const totalDuration =
          activeVideo.durationInSeconds && activeVideo.durationInSeconds > 0
            ? activeVideo.durationInSeconds
            : typeof activePlayer.getDuration === "function"
            ? Math.floor(activePlayer.getDuration())
            : 0;

        if (watchedSeconds < 0) return;

        await api.patch(`/videos/${activeVideo._id}/progress`, {
          watchedSeconds,
          durationInSeconds: totalDuration,
          ytVideoId: activeVideo.ytVideoId,
        });

        const progressPercent =
          totalDuration > 0
            ? Math.min(100, Math.round((watchedSeconds / totalDuration) * 100))
            : 0;

        const isCompleted = progressPercent >= 95 ? true : activeVideo.completed;

        setVideos((prev) =>
          prev.map((v) =>
            v._id === activeVideo._id
              ? {
                  ...v,
                  watchedSeconds,
                  // Maintain authoritative duration: never overwrite with player's if already known
                  durationInSeconds:
                    v.durationInSeconds && v.durationInSeconds > 0
                      ? v.durationInSeconds
                      : totalDuration || v.durationInSeconds,
                  progressPercent,
                  completed: isCompleted,
                }
              : v,
          ),
        );
      } catch (error) {
        console.error(
          "[PlaylistPlayer] Save Progress Error:",
          error.message || error,
        );
      }
    },
    [],
  );

  // Sync progress periodically and cleanly on video change / unmount
  useEffect(() => {
    if (!player || !currentVideo) return;

    const checkPlayerMatches = () => {
      try {
        const ytData =
          typeof player.getVideoData === "function"
            ? player.getVideoData()
            : null;
        return (
          !ytData?.video_id ||
          !currentVideo.ytVideoId ||
          ytData.video_id === currentVideo.ytVideoId
        );
      } catch {
        return false;
      }
    };

    if (!checkPlayerMatches()) return;

    // Sync progress every 45 seconds while playing
    const interval = setInterval(() => {
      saveProgress(currentVideo, player, false);
    }, 45000);

    return () => {
      clearInterval(interval);
      if (checkPlayerMatches()) {
        saveProgress(currentVideo, player, true);
      }
    };
  }, [player, currentVideo, saveProgress]);

  const handleVideoSelect = useCallback(
    (targetVideoId) => {
      navigate(`/playlist/${playlistId}/video/${targetVideoId}`);
    },
    [navigate, playlistId],
  );

  const handleToggleComplete = useCallback(async () => {
    if (!currentVideo) return;
    try {
      const res = await api.patch(`/videos/${currentVideo._id}`, {
        completed: !currentVideo.completed,
      });
      const updatedVideo = res.data.video;
      setVideos((prev) =>
        prev.map((v) => (v._id === currentVideo._id ? updatedVideo : v)),
      );
    } catch (error) {
      console.error("[PlaylistPlayer] Toggle Complete Error:", error);
    }
  }, [currentVideo]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < videos.length - 1;

  const handlePrevLesson = useCallback(() => {
    if (hasPrev) {
      handleVideoSelect(videos[currentIndex - 1]._id);
    }
  }, [hasPrev, currentIndex, videos, handleVideoSelect]);

  const handleNextLesson = useCallback(() => {
    if (hasNext) {
      handleVideoSelect(videos[currentIndex + 1]._id);
    }
  }, [hasNext, currentIndex, videos, handleVideoSelect]);

  const handleNotesOpen = useCallback(() => {
    setSidebarTab("notes");
  }, []);

  const handlePlayerReady = useCallback((ytPlayerInstance) => {
    setPlayer(ytPlayerInstance);
  }, []);

  if (loading) {
    return (
      <Loader
        text="Loading Player..."
        subtitle="Getting cinema watch room ready."
        fullscreen
      />
    );
  }

  return (
    <AppShell showBack title={currentVideo?.title || "Now Playing"} className="flex flex-col">
      <div className="w-full max-w-[1540px] mx-auto flex-1 flex flex-col px-3 sm:px-6 pb-8 min-h-0 font-sans space-y-4">
        {/* Top Watchroom Header */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-red-500" />
              {playlist?.title || "Course"}
            </span>
          </div>
        </div>

        {/* Watchroom Main Area */}
        <div className="flex flex-col lg:flex-row gap-6 w-full flex-1 min-h-0 justify-center">
          {/* LEFT COLUMN: Video Player & Info */}
          <div className="flex-1 min-w-0 flex flex-col space-y-4">
            {/* Video Player Container */}
            <div className="w-full">
              <VideoPlayer
                key={currentVideo?._id || currentVideo?.ytVideoId}
                videoId={currentVideo?.ytVideoId}
                thumbnailUrl={currentVideo?.thumbnailUrl}
                title={currentVideo?.title}
                startTime={startTime}
                onPlayerReady={handlePlayerReady}
              />
            </div>

            {/* Player Info & Navigation Card */}
            {currentVideo && (
              <PlayerInfoCard
                currentVideo={currentVideo}
                playlist={playlist}
                currentIndex={currentIndex}
                totalVideos={videos.length}
                onNotesClick={handleNotesOpen}
                onToggleComplete={handleToggleComplete}
                onPrevLesson={handlePrevLesson}
                onNextLesson={handleNextLesson}
                hasPrev={hasPrev}
                hasNext={hasNext}
              />
            )}
          </div>

          {/* RIGHT COLUMN: Tabbed Queue & Notes Sidebar */}
          <PlayerSidebar
            videos={videos}
            playlist={playlist}
            currentVideo={currentVideo}
            currentIndex={currentIndex}
            player={player}
            onVideoSelect={handleVideoSelect}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            onVideoUpdated={(updatedVideo) =>
              setVideos((prev) =>
                prev.map((v) => (v._id === updatedVideo._id ? updatedVideo : v)),
              )
            }
          />
        </div>
      </div>
    </AppShell>
  );
}
