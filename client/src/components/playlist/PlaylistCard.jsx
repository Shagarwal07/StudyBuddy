import { ArrowRight, Trash2, RefreshCw } from "lucide-react";
import DropdownMenu from "../common/DropdownMenu";

export default function PlaylistCard({
  playlist,
  onClick,
  onDelete,
  onResync,
}) {
  
  const completed = playlist.completedVideos ?? 0;
  const total = playlist.totalVideos ?? 0;
  const progress = playlist.progress ?? 0;
  const isSingleVideo = playlist.ytPlaylistId?.startsWith("video_") || total === 1;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Open ${isSingleVideo ? "video" : "playlist"} ${playlist.title}`}
      onKeyDown={(e) => {
        if (["Enter", " "].includes(e.key)) {
          e.preventDefault();
          onClick();
        }
      }}
      className="relative group cursor-pointer rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 hover:border-neutral-700 hover:bg-neutral-900/90 transition-all duration-200"
    >
      <div
        className="absolute top-3 right-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu
          items={[
            {
              label: isSingleVideo ? "Refresh Details" : "Resync Playlist",
              icon: RefreshCw,
              onClick: () => onResync(playlist._id),
            },
            {
              label: isSingleVideo ? "Delete Video" : "Delete Playlist",
              icon: Trash2,
              danger: true,
              onClick: () => onDelete(playlist._id),
            },
          ]}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <img
          src={playlist.thumbnailUrl}
          alt={playlist.title}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60";
          }}
          className="w-full sm:w-36 aspect-video rounded-lg object-cover shrink-0 bg-neutral-950 border border-neutral-800"
        />

        <div className="flex-1 flex flex-col justify-between min-w-0 pr-10">
          <div>
            <h3 className="text-base font-semibold text-white line-clamp-2 group-hover:text-red-400 transition-colors duration-200">
              {playlist.title}
            </h3>

            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
              <span>
                {completed} / {total} {total === 1 ? "video" : "videos"}
              </span>

              <span>{playlist.remainingHours ?? 0} hrs left</span>

              <span className="text-red-400 font-semibold">{progress}%</span>
            </div>

            <div className="mt-3 h-1.5 rounded-full bg-neutral-800 border border-neutral-700/50 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <div className="flex items-center gap-2 text-sm text-red-400 group-hover:text-red-300 font-medium group-hover:translate-x-1 transition-transform duration-200">
              Continue
              <ArrowRight className="w-4 h-4 text-red-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
