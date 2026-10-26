import { memo } from "react";
import { FileText, Check } from "lucide-react";
import formatDuration from "../../utils/formatDuration";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60";

const VideoRow = memo(({
  video,
  index,
  isNext = false,
  onVideoClick,
  onToggleComplete,
  onNotesClick,
}) => {
  const hasNotes = Boolean(video.notes?.trim()) || Boolean(video.hasStudyGuide);
  const isCompleted = Boolean(video.completed);
  const progressPercent = video.progressPercent || 0;

  const thumbnailSrc =
    video.thumbnailUrl ||
    (video.ytVideoId
      ? `https://i.ytimg.com/vi/${video.ytVideoId}/hqdefault.jpg`
      : FALLBACK_THUMBNAIL);

  return (
    <div
      onClick={() => onVideoClick(video._id)}
      role="button"
      tabIndex={0}
      aria-label={`Play lesson ${index + 1}: ${video.title}`}
      onKeyDown={(e) => {
        if (["Enter", " "].includes(e.key)) {
          e.preventDefault();
          onVideoClick(video._id);
        }
      }}
      className={`group relative flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
        isNext
          ? "bg-[#140b0e] border-red-500/40 shadow-sm shadow-red-500/10"
          : isCompleted
          ? "bg-[#0d090c]/80 border-neutral-800/80 hover:border-neutral-700 hover:bg-[#120d11]"
          : "bg-[#0d090c]/90 border-neutral-800/80 hover:border-neutral-700 hover:bg-[#140e13]"
      }`}
    >
      {/* Left: Index + Thumbnail + Title/Status */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Index number */}
        <span className="w-6 text-center font-mono text-sm sm:text-base font-bold text-neutral-500 group-hover:text-white shrink-0 select-none">
          {index + 1}
        </span>

        {/* Thumbnail with completed checkmark overlay */}
        <div className="relative w-24 sm:w-28 md:w-32 aspect-video rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-neutral-800/90 shadow-inner">
          <img
            src={thumbnailSrc}
            alt={video.title}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isCompleted ? "opacity-85" : "opacity-100"
            }`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_THUMBNAIL;
            }}
          />

          {/* Completed Checkmark Overlay */}
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete?.(video._id, isCompleted);
                }}
                title="Mark as uncompleted"
                className="w-7 h-7 rounded-full bg-[#d4e976] text-black flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition cursor-pointer pointer-events-auto"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
          )}

          {/* In-progress bar */}
          {progressPercent > 0 && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/70">
              <div
                className="h-full bg-red-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Title and Status */}
        <div className="min-w-0 flex-1 pr-2">
          <h3
            className={`text-xs sm:text-sm font-bold line-clamp-1 sm:line-clamp-2 transition-colors ${
              isCompleted
                ? "text-neutral-300 group-hover:text-white"
                : "text-white group-hover:text-red-400"
            }`}
          >
            {video.title}
          </h3>

          <p className="text-[11px] font-mono text-neutral-400 mt-0.5 truncate">
            {isCompleted ? (
              <span className="text-neutral-400">Completed</span>
            ) : progressPercent > 0 ? (
              <span className="text-red-400">{progressPercent}% watched</span>
            ) : (
              <span>Not started</span>
            )}
          </p>
        </div>
      </div>

      {/* Middle: Study Guide Button */}
      <div className="shrink-0 flex items-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNotesClick(video);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 transition cursor-pointer ${
            hasNotes
              ? "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
              : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-300 hover:border-amber-500/30"
          }`}
          title="Open Study Guide & Notes"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Study Guide</span>
        </button>
      </div>

      {/* Right: Duration */}
      <div className="w-16 text-right shrink-0">
        <span className="text-xs font-mono font-medium text-neutral-300">
          {formatDuration(video.durationInSeconds)}
        </span>
      </div>
    </div>
  );
});

VideoRow.displayName = "VideoRow";
export default VideoRow;