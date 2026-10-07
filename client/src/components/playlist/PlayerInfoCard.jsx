import { memo } from "react";
import { FileText, Check, ChevronLeft, ChevronRight } from "lucide-react";

const PlayerInfoCard = memo(
  ({
    currentVideo,
    playlist,
    currentIndex,
    totalVideos,
    onNotesClick,
    onToggleComplete,
    onPrevLesson,
    onNextLesson,
    hasPrev,
    hasNext,
  }) => {
    const isCompleted = Boolean(currentVideo?.completed);

    return (
      <div className="bg-white dark:bg-[#0E0E12] border border-slate-200 dark:border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs dark:shadow-none transition-colors">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Now Playing
            </span>
            <span className="text-xs text-slate-400 dark:text-neutral-500 font-mono">
              Lesson {currentIndex + 1} of {totalVideos}
            </span>
            {playlist?.title && (
              <>
                <span className="text-slate-300 dark:text-neutral-700 hidden sm:inline">•</span>
                <span className="text-xs text-slate-500 dark:text-neutral-400 truncate max-w-[200px] sm:max-w-xs hidden sm:inline">
                  {playlist.title}
                </span>
              </>
            )}
          </div>

          {/* Quick Lesson Navigation & Actions */}
          <div className="flex items-center gap-2">
            {/* Mark as Completed Button */}
            {onToggleComplete && (
              <button
                type="button"
                onClick={onToggleComplete}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isCompleted
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700"
                }`}
                title={isCompleted ? "Mark uncompleted" : "Mark completed"}
              >
                <Check className={`w-3.5 h-3.5 ${isCompleted ? "stroke-[3]" : ""}`} />
                <span>{isCompleted ? "Completed" : "Mark as Done"}</span>
              </button>
            )}

            {/* Previous Lesson */}
            <button
              type="button"
              disabled={!hasPrev}
              onClick={onPrevLesson}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Previous lesson"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Next Lesson */}
            <button
              type="button"
              disabled={!hasNext}
              onClick={onNextLesson}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
              title="Next lesson"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Notes Button */}
            <button
              type="button"
              onClick={() => onNotesClick(currentVideo)}
              className="px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700"
            >
              <FileText className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span>Notes</span>
            </button>
          </div>
        </div>

        {/* Video Title */}
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 leading-snug">
          {currentVideo?.title}
        </h1>
      </div>
    );
  },
);

PlayerInfoCard.displayName = "PlayerInfoCard";
export default PlayerInfoCard;
