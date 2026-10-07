import { memo } from "react";
import { FileText, Check, Play } from "lucide-react";
import formatDuration from "../../utils/formatDuration";

const VideoRow = memo(({
  video,
  index,
  isNext = false,
  onVideoClick,
  onToggleComplete,
  onNotesClick,
}) => {
  const hasNotes = Boolean(video.notes?.trim());
  const isCompleted = Boolean(video.completed);
  const progressPercent = video.progressPercent || 0;

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
      className={`group relative grid grid-cols-12 gap-3 sm:gap-4 items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition-all duration-150 cursor-pointer ${
        isNext
          ? "bg-red-500/[0.04] dark:bg-red-500/[0.06] border-red-500/30 dark:border-red-500/25 shadow-xs"
          : isCompleted
          ? "bg-slate-50/50 dark:bg-neutral-900/30 border-slate-200/60 dark:border-neutral-800/40 opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-900/60"
          : "bg-white dark:bg-[#0E0E12] border-slate-200/80 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-900/80 shadow-xs dark:shadow-none"
      }`}
    >
      {/* Col 1: Index / Play / Checkmark */}
      <div className="col-span-1 flex items-center justify-center">
        <button
          type="button"
          title={isCompleted ? "Mark as uncompleted" : "Mark as completed"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(video._id, isCompleted);
          }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            isCompleted
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
              : "text-slate-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-md font-mono"
          }`}
        >
          {isCompleted ? (
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          ) : (
            <>
              <span className="font-mono text-xs group-hover:hidden select-none">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Play className="w-3.5 h-3.5 fill-red-500 text-red-500 hidden group-hover:block ml-0.5" />
            </>
          )}
        </button>
      </div>

      {/* Col 2: Thumbnail & Title */}
      <div className="col-span-8 sm:col-span-7 md:col-span-7 flex items-center gap-3 sm:gap-3.5 min-w-0">
        <div className="relative w-20 sm:w-28 md:w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-neutral-950 border border-slate-200 dark:border-neutral-800">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60";
            }}
          />
          {progressPercent > 0 && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/70">
              <div
                className="h-full bg-red-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-xs sm:text-sm font-medium line-clamp-1 sm:line-clamp-2 transition-colors ${
                isCompleted
                  ? "text-slate-500 dark:text-neutral-400 line-through decoration-slate-300 dark:decoration-neutral-700"
                  : "text-slate-900 dark:text-neutral-100 group-hover:text-red-500 dark:group-hover:text-red-400"
              }`}
            >
              {video.title}
            </h3>
            {isNext && !isCompleted && (
              <span className="hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-medium uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25 shrink-0">
                Next
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-neutral-500 font-mono">
            <span>{formatDuration(video.durationInSeconds)}</span>
            {progressPercent > 0 && !isCompleted && (
              <>
                <span>•</span>
                <span className="text-red-400">{progressPercent}% watched</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Col 3: Notes Pill (hidden on mobile) */}
      <div className="hidden sm:flex sm:col-span-2 md:col-span-2 items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNotesClick(video);
          }}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            hasNotes
              ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20"
              : "text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 opacity-60 group-hover:opacity-100"
          }`}
          title={hasNotes ? "View saved notes" : "Add note"}
        >
          <FileText className="w-3 h-3" />
          <span>{hasNotes ? "Notes" : "Add Note"}</span>
        </button>
      </div>

      {/* Col 4: Duration & Mobile Notes */}
      <div className="col-span-3 sm:col-span-2 md:col-span-2 flex items-center justify-end gap-2 text-right">
        <span className="font-mono text-xs text-slate-500 dark:text-neutral-400 hidden sm:inline">
          {formatDuration(video.durationInSeconds)}
        </span>

        {/* Mobile Notes Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNotesClick(video);
          }}
          className={`sm:hidden p-1.5 rounded-md cursor-pointer transition-colors ${
            hasNotes ? "text-amber-500 bg-amber-500/10" : "text-slate-400 hover:text-slate-600"
          }`}
          title={hasNotes ? "View notes" : "Add note"}
        >
          <FileText className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

VideoRow.displayName = "VideoRow";
export default VideoRow;