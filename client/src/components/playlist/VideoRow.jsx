import { memo } from "react";
import { FileText } from "lucide-react";
import formatDuration from "../../utils/formatDuration";

const VideoRow = memo(({ 
  video, 
  index, 
  onVideoClick, 
  onToggleComplete, 
  onNotesClick 
}) => {
  return (
    <div className="group bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/70 transition-all duration-200 rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between gap-4">
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => onVideoClick(video._id)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(video._id, video.completed);
            }}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${
              video.completed
                ? "bg-red-500 text-white"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-red-500/40"
            }`}
          >
            {video.completed ? "✓" : index + 1}
          </button>

          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-24 rounded-lg object-cover shrink-0 aspect-video border border-neutral-800"
            loading="lazy"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium line-clamp-2 text-neutral-100 transition-colors duration-200 group-hover:text-red-400">
              {video.title}
            </h3>

            <div className="mt-2">
              <div className="flex justify-between text-xs text-neutral-400 mb-1 font-mono">
                <span>{formatDuration(video.durationInSeconds)}</span>
                <span>{video.progressPercent}%</span>
              </div>

              <div className="w-full h-1 rounded-full bg-neutral-800 border border-neutral-700/50 overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D]"
                  style={{ width: `${video.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNotesClick(video)}
          className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            video.notes?.trim()
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700"
          }`}
        >
          <FileText className={`w-3.5 h-3.5 ${video.notes?.trim() ? "text-red-400" : "text-neutral-400"}`} />
          <span className="text-xs font-medium">
            {video.notes?.trim() ? "Saved" : "Notes"}
          </span>
        </button>
      </div>
    </div>
  );
});

VideoRow.displayName = "VideoRow";
export default VideoRow;