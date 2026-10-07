import { useEffect, useState, useCallback, useMemo } from "react";
import { Tv, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell, { SidebarTrigger } from "../components/layout/AppShell";
import PlaylistCard from "../components/playlist/PlaylistCard";
import api from "../api/axios";
import CreatePlaylistModal from "../components/modals/CreatePlaylistModal";
import ConfirmModal from "../components/modals/ConfirmModal";
import useDeletePlaylist from "../hooks/useDeletePlaylist";
import useResyncPlaylist from "../hooks/useResyncPlaylist";
import useImportPlaylist from "../hooks/useImportPlaylist";
import Loader from "../components/common/Loader";

export default function YouTubeHub() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
  } = useResyncPlaylist(useCallback(() => fetchPlaylists(), [fetchPlaylists]));

  const {
    importing,
    showModal,
    openModal,
    closeModal: closeImportModal,
    handleImport,
  } = useImportPlaylist(
    useCallback(() => fetchPlaylists(), [fetchPlaylists]),
    "/youtube",
  );

  const { deleting, showDeleteModal, handleDelete, confirmDelete, closeModal } =
    useDeletePlaylist(useCallback(() => fetchPlaylists(), [fetchPlaylists]));

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    return playlists.filter(
      (p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.channelTitle && p.channelTitle.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [playlists, searchQuery]);

  if (loading) {
    return <Loader text="Loading Ad - free Video..." subtitle="Fetching your courses." fullscreen />;
  }

  return (
    <AppShell title="Ad - free Video" showBack={false}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
        {/* Top Header */}
        <section className="pt-2 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <SidebarTrigger />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <Tv className="w-5 h-5 text-red-500 dark:text-red-400" />
              Ad - free Video
            </h1>
          </div>
        </section>

        {/* Search Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, playlists or videos..."
              className="w-full bg-white dark:bg-[#0E0E12] border border-slate-200 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 outline-none focus:border-red-500 transition-colors shadow-xs dark:shadow-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono hidden sm:inline">
              {playlists.length} {playlists.length === 1 ? "course" : "courses"} tracked
            </span>
            {playlists.length > 0 && (
              <button
                type="button"
                onClick={openModal}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Import</span>
              </button>
            )}
          </div>
        </div>

        {/* Playlists List */}
        {filteredPlaylists.length === 0 ? (
          <div className="py-12 px-6 flex flex-col md:flex-row items-center justify-center bg-white dark:bg-neutral-900/40 border border-slate-200 dark:border-neutral-800 rounded-2xl gap-6 max-w-2xl mx-auto my-6 text-center md:text-left shadow-xs dark:shadow-none">
            <div className="relative shrink-0 group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-red-500/20 via-purple-500/20 to-transparent rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500" />
              <img
                src="/assets/learning-illustration.jpg"
                alt="Start Learning Illustration"
                className="relative w-44 sm:w-52 h-36 sm:h-40 object-cover rounded-xl border border-slate-200 dark:border-neutral-800 shadow-xl shadow-black/10 dark:shadow-black/60 transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="space-y-2.5 flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                {searchQuery ? "No matching courses found" : "Your Ad - free Video library is empty"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">
                {searchQuery
                  ? "Try searching for a different course name or keyword."
                  : "Import YouTube playlists or single video courses to track watched chapters, take timestamped notes, and maintain your learning streak."}
              </p>
              <button
                type="button"
                onClick={openModal}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white text-xs font-semibold transition-all duration-200 cursor-pointer shadow-md shadow-red-500/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] mx-auto md:mx-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Import Playlist or Video</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist._id}
                playlist={playlist}
                onClick={() => navigate(`/playlist/${playlist._id}`)}
                onDelete={handleDelete}
                onResync={handleResync}
              />
            ))}
          </div>
        )}
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
