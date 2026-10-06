import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onImport,
  importing,
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!isOpen) {
      queueMicrotask(() => {
        setUrl("");
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape" && !importing) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, importing, onClose]);

  if (!isOpen) {
    return null;
  }

  const isShorts = url.trim().includes("/shorts/");

  const handleImport = () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl || importing || isShorts) {
      return;
    }

    onImport(trimmedUrl);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-playlist-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#121214] p-6 shadow-2xl">
        <h2 id="create-playlist-title" className="text-lg font-bold text-neutral-100">
          Import Playlist or Video
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Paste a YouTube playlist or single video URL. (Shorts not supported)
        </p>

        <input
          autoFocus
          type="url"
          value={url}
          placeholder="https://youtube.com/playlist?list=... or youtu.be/..."
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isShorts) {
              handleImport();
            }
          }}
          className={`mt-4 w-full rounded-xl border bg-[#0E0E12] px-4 py-2.5 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 outline-none transition-colors font-mono ${
            isShorts
              ? "border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
              : "border-neutral-800 focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
          }`}
        />

        {isShorts && (
          <p className="text-[11px] text-red-400 mt-2 flex items-center gap-1.5 font-medium">
            <span>⚠️ YouTube Shorts are not supported. Please paste a full video or playlist link.</span>
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            disabled={importing}
            onClick={() => {
              if (!importing) {
                onClose();
              }
            }}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={importing || !url.trim() || isShorts}
            onClick={handleImport}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
              importing || !url.trim() || isShorts
                ? "cursor-not-allowed bg-neutral-800/80 border border-neutral-700/50 text-neutral-500"
                : "bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white shadow-md shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{importing ? "Importing..." : "Import"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
