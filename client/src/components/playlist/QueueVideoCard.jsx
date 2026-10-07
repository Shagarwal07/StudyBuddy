import { memo } from "react";
import { Check, Play, FileText } from "lucide-react";
import formatDuration from "../../utils/formatDuration";

const QueueVideoCard = memo(
  ({ video, index, isActive, onVideoSelect, onNotesClick }) => {
    const isCompleted = Boolean(video.completed);
    const hasNotes = Boolean(video.notes?.trim());

    return (
      <div
        onClick={() => onVideoSelect(video._id)}
        role="button"
        tabIndex={0}
        aria-label={`Select lesson ${index + 1}: ${video.title}`}
        onKeyDown={(e) => {
          if (["Enter", " "].includes(e.key)) {
            e.preventDefault();
            onVideoSelect(video._id);
          }
        }}
        className={`rounded-xl p-2.5 cursor-pointer border transition-all duration-150 flex items-center gap-3 group select-none ${
          isActive
            ? "bg-red-500/10 border-red-500/35 dark:bg-red-500/[0.08] dark:border-red-500/30 shadow-xs"
            : isCompleted
            ? "bg-transparent hover:bg-slate-100/70 dark:hover:bg-neutral-900/60 border-transparent hover:border-slate-200 dark:hover:border-neutral-800 opacity-80 hover:opacity-100"
            : "bg-transparent hover:bg-slate-100/70 dark:hover:bg-neutral-900/60 border-transparent hover:border-slate-200 dark:hover:border-neutral-800"
        }`}
      >
        {/* Index / Status Icon */}
        <div className="shrink-0 w-6 flex items-center justify-center">
          {isCompleted ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400 stroke-[3]" />
            </div>
          ) : isActive ? (
            <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs">
              <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
            </div>
          ) : (
            <span className="font-mono text-xs text-slate-400 dark:text-neutral-500 group-hover:text-slate-600 dark:group-hover:text-neutral-300">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
        </div>

        {/* Thumbnail */}
        <div className="relative shrink-0 w-20 sm:w-24 aspect-video rounded-lg overflow-hidden bg-neutral-950 border border-slate-200 dark:border-neutral-800">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60";
            }}
          />

          {/* Progress Bar */}
          {video.progressPercent > 0 && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/70">
              <div
                className="h-full bg-red-500"
                style={{ width: `${video.progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
          <div className="flex items-start justify-between gap-1.5">
            <p
              className={`text-xs font-medium line-clamp-2 leading-snug flex-1 ${
                isActive
                  ? "text-red-600 dark:text-red-300 font-semibold"
                  : isCompleted
                  ? "text-slate-500 dark:text-neutral-400"
                  : "text-slate-800 dark:text-neutral-200 group-hover:text-slate-900 dark:group-hover:text-white"
              }`}
            >
              {video.title}
            </p>

            {hasNotes && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNotesClick(video);
                }}
                className="p-1 rounded-md text-amber-500 hover:bg-amber-500/10 shrink-0"
                title="View notes"
              >
                <FileText className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-1">
            <span>{formatDuration(video.durationInSeconds)}</span>
            {isActive && (
              <span className="text-red-500 font-semibold tracking-wider uppercase text-[9px]">
                Playing
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

QueueVideoCard.displayName = "QueueVideoCard";
export default QueueVideoCard;
