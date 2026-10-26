import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Search, Link2, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell, { SidebarTrigger } from "../components/layout/AppShell";
import api from "../api/axios";
import CreatePlaylistModal from "../components/modals/CreatePlaylistModal";
import ConfirmModal from "../components/modals/ConfirmModal";
import DropdownMenu from "../components/common/DropdownMenu";
import useDeletePlaylist from "../hooks/useDeletePlaylist";
import useResyncPlaylist from "../hooks/useResyncPlaylist";
import useImportPlaylist from "../hooks/useImportPlaylist";
import Loader from "../components/common/Loader";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";

export default function YouTubeHub() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // "all" | "in_progress" | "finished"
  const [inlineUrl, setInlineUrl] = useState("");

  const navigate = useNavigate();

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/playlists");
      setPlaylists(res.data.playlists || []);
    } catch (err) {
      console.error("[YouTubeHub] Fetch Playlists Error:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  const {
    syncing,
    showResyncModal,
    handleResync,
    confirmResync,
    closeModal: closeResyncModal,
  } = useResyncPlaylist(fetchPlaylists);

  const {
    importing,
    showModal,
    openModal,
    closeModal: closeImportModal,
    handleImport,
  } = useImportPlaylist(fetchPlaylists, "/youtube");

  const { deleting, showDeleteModal, handleDelete, confirmDelete, closeModal } =
    useDeletePlaylist(fetchPlaylists);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const filteredPlaylists = useMemo(() => {
    let list = playlists;

    if (filterTab === "in_progress") {
      list = list.filter((p) => (p.progress ?? 0) > 0 && (p.progress ?? 0) < 100);
    } else if (filterTab === "finished") {
      list = list.filter((p) => (p.progress ?? 0) >= 100);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.channelTitle && p.channelTitle.toLowerCase().includes(q))
    );
  }, [playlists, filterTab, searchQuery]);

  const handleInlineSubmit = async (e) => {
    e.preventDefault();
    if (!inlineUrl.trim()) return;
    await handleImport(inlineUrl.trim());
    setInlineUrl("");
  };

  if (loading) {
    return <Loader text="Loading Ad-free Workspace..." subtitle="Fetching your courses." fullscreen />;
  }

  return (
    <AppShell title="YouTube Workspace" showBack={false}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        
        {/* Top Floating App Bar */}
        <div className="pt-2 flex items-center justify-between border-b border-neutral-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <SidebarTrigger />
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-neutral-400">
              Workspace / Ad-free Video
            </span>
          </div>

          <span className="text-xs font-mono text-neutral-400">
            {playlists.length} {playlists.length === 1 ? "course" : "courses"} in library
          </span>
        </div>

        {/* 1. Add Anything Inline Bar */}
        <section className="rounded-2xl bg-[#0e0a0d]/90 border border-neutral-800/80 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Add anything
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Any playlist or single video, ad-free.
            </p>
          </div>

          <form
            onSubmit={handleInlineSubmit}
            className="relative flex-1 max-w-xl flex items-center bg-[#070507] border border-neutral-800 rounded-xl px-3 py-1.5 focus-within:border-red-500/80 transition"
          >
            <Link2 className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
            <input
              type="text"
              value={inlineUrl}
              onChange={(e) => setInlineUrl(e.target.value)}
              placeholder="Paste a YouTube link"
              disabled={importing}
              className="bg-transparent text-xs text-white placeholder-neutral-500 outline-none flex-1 min-w-0 pr-2"
            />
            <button
              type="submit"
              disabled={importing || !inlineUrl.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#BA3C3C] hover:bg-[#e53935] text-white font-bold text-xs transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
            >
              {importing ? (
                <>
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <span>Import</span>
              )}
            </button>
          </form>
        </section>

        {/* 3. Your Library Section */}
        <section className="space-y-4">
          {/* Section Header: Title on Left, Filter Tabs + Search on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Your library
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-medium select-none">
                <button
                  type="button"
                  onClick={() => setFilterTab("all")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterTab === "all"
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("in_progress")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterTab === "in_progress"
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  In progress
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab("finished")}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    filterTab === "finished"
                      ? "bg-white text-black font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Finished
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your library"
                  className="bg-[#0e0a0d] border border-neutral-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500 transition w-44 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlaylists.map((playlist) => {
              const completed = playlist.completedVideos ?? 0;
              const total = playlist.totalVideos ?? 0;
              const progress = playlist.progress ?? 0;
              const isSingleVideo =
                playlist.ytPlaylistId?.startsWith("video_") || total === 1;

              return (
                <div
                  key={playlist._id}
                  onClick={() => navigate(`/playlist/${playlist._id}`)}
                  className="group relative cursor-pointer rounded-2xl border border-neutral-800/80 bg-[#0d090c]/90 hover:bg-[#140e13] hover:border-neutral-700 transition flex flex-col overflow-hidden shadow-md"
                >
                  {/* Thumbnail area */}
                  <div className="aspect-video w-full relative overflow-hidden bg-neutral-950">
                    <img
                      src={playlist.thumbnailUrl || FALLBACK_THUMBNAIL}
                      alt={playlist.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_THUMBNAIL;
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Top-left Badge: PLAYLIST or VIDEO */}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-mono font-bold tracking-wider text-neutral-200 uppercase border border-white/10">
                      {isSingleVideo ? "VIDEO" : "PLAYLIST"}
                    </span>

                    {/* Top-right Badge: % Progress */}
                    <span
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-sm ${
                        progress >= 100
                          ? "bg-emerald-400 text-black"
                          : progress > 0
                          ? "bg-[#d4e976] text-black"
                          : "bg-neutral-800/90 text-neutral-300 border border-neutral-700"
                      }`}
                    >
                      {progress}%
                    </span>
                  </div>

                  {/* Info area */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                      {playlist.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-800/50">
                      <span className="truncate pr-1">
                        {completed} / {total} videos
                        {playlist.remainingHours ? ` • ${playlist.remainingHours} hrs left` : ""}
                      </span>

                      {/* 3-dots Dropdown Menu */}
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <DropdownMenu
                          items={[
                            {
                              label: isSingleVideo ? "Refresh Details" : "Resync Playlist",
                              icon: RefreshCw,
                              onClick: () => handleResync(playlist._id),
                            },
                            {
                              label: isSingleVideo ? "Delete Video" : "Delete Playlist",
                              icon: Trash2,
                              danger: true,
                              onClick: () => handleDelete(playlist._id),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dashed "+ Add a playlist or video" Card */}
            <div
              onClick={openModal}
              className="min-h-[220px] rounded-2xl border-2 border-dashed border-neutral-800/90 hover:border-red-500/60 hover:bg-neutral-900/30 transition flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 group-hover:bg-red-500/20 transition duration-200 mb-3">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-300 group-hover:text-white transition">
                Add a playlist or video
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      <CreatePlaylistModal
        isOpen={showModal}
        onClose={closeImportModal}
        onImport={handleImport}
        importing={importing}
      />

      <ConfirmModal
        variant="primary"
        isOpen={showResyncModal}
        title="Resync Playlist?"
        message="StudyBuddy will check YouTube for newly added videos. Your progress, notes, and completed videos will be preserved."
        loading={syncing}
        loadingText="Syncing..."
        confirmText="Resync Playlist"
        onCancel={closeResyncModal}
        onConfirm={confirmResync}
      />

      <ConfirmModal
        variant="danger"
        isOpen={showDeleteModal}
        title="Delete Playlist?"
        message="This will permanently delete this playlist, all progress, and all notes. This action cannot be undone."
        loading={deleting}
        loadingText="Deleting..."
        confirmText="Delete Playlist"
        onCancel={closeModal}
        onConfirm={confirmDelete}
      />
    </AppShell>
  );
}
