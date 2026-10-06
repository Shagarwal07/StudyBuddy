import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Heatmap({ heatmap = {}, days = 365 }) {
  const scrollContainerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const canHover = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover)").matches;
  }, []);

  const { weeks, weekMonths, centerWeekIndices } = useMemo(() => {
    const allDays = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const key = date.toLocaleDateString("en-CA");

      allDays.push({
        date,
        key,
        activity: heatmap[key] || {
          videosCompleted: 0,
          minutesStudied: 0,
          codingProblemsSolved: 0,
        },
      });
    }

    const firstDayOfWeek = (allDays[0].date.getDay() + 6) % 7;
    for (let i = 0; i < firstDayOfWeek; i++) {
      allDays.unshift(null);
    }

    while (allDays.length % 7 !== 0) {
      allDays.push(null);
    }

    const weeksList = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeksList.push(allDays.slice(i, i + 7));
    }

    const monthsList = weeksList.map((week) => {
      const firstValidDay = week.find((d) => d !== null);
      return firstValidDay
        ? firstValidDay.date.toLocaleString("default", { month: "short" })
        : "";
    });

    const centerIndices = new Map();
    let startIdx = 0;

    for (let i = 0; i <= monthsList.length; i++) {
      if (i === monthsList.length || monthsList[i] !== monthsList[startIdx]) {
        const endIdx = i - 1;
        const midIdx = startIdx + Math.floor((endIdx - startIdx) / 2);
        if (monthsList[startIdx]) {
          centerIndices.set(midIdx, monthsList[startIdx]);
        }
        startIdx = i;
      }
    }

    return {
      weeks: weeksList,
      weekMonths: monthsList,
      centerWeekIndices: centerIndices,
    };
  }, [heatmap, days]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [weeks.length]);

  const getColor = (activity) => {
    const minutes = activity?.minutesStudied ?? 0;
    const problems = activity?.codingProblemsSolved ?? 0;
    const videos = activity?.videosCompleted ?? 0;

    const score = problems * 2 + (minutes > 0 ? Math.ceil(minutes / 20) : 0) + videos;

    if (score === 0) return "bg-neutral-800/80 border border-neutral-700/30";
    if (score === 1) return "bg-red-500/25 border border-red-500/30";
    if (score <= 3) return "bg-red-500/60 border border-red-500/60";
    if (score <= 6) return "bg-red-500 border border-red-400";

    return "bg-red-400 border border-red-300";
  };

  const getTooltipStyles = () => {
    if (!tooltip || typeof window === "undefined") return {};

    const OFFSET = 12;
    const isNearRightEdge = tooltip.x > window.innerWidth - 240;
    const isNearBottomEdge = tooltip.y > window.innerHeight - 130;

    const left = isNearRightEdge ? tooltip.x - OFFSET : tooltip.x + OFFSET;
    const top = isNearBottomEdge ? tooltip.y - OFFSET : tooltip.y + OFFSET;

    return {
      left: `${left}px`,
      top: `${top}px`,
      transform: `${isNearRightEdge ? "translateX(-100%)" : "translateX(0)"} ${
        isNearBottomEdge ? "translateY(-100%)" : "translateY(0)"
      }`,
    };
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 w-full backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">
            Activity Heatmap
          </h2>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Videos watched and coding problems solved over the past year
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col gap-1 text-[11px] text-neutral-500 shrink-0 select-none pt-6">
          {WEEK_DAYS.map((day) => (
            <div
              key={day}
              className="h-4 flex items-center justify-end font-medium leading-none"
            >
              {day}
            </div>
          ))}
        </div>

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto flex-1 pb-3 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-neutral-900/50 [&::-webkit-scrollbar-thumb]:bg-neutral-700/60 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-neutral-600"
        >
          <div className="flex gap-1 w-max">
            {weeks.map((week, weekIndex) => {
              const monthLabel = centerWeekIndices.get(weekIndex);
              const isNewMonth =
                weekIndex > 0 &&
                weekMonths[weekIndex] !== weekMonths[weekIndex - 1];

              return (
                <div
                  key={weekIndex}
                  className={`flex flex-col gap-1 ${isNewMonth ? "ml-3.5" : ""}`}
                >
                  <div className="h-5 text-[11px] text-neutral-400 font-medium relative w-4">
                    {monthLabel && (
                      <span className="absolute left-1/2 -translate-x-1/2 top-0 whitespace-nowrap select-none">
                        {monthLabel}
                      </span>
                    )}
                  </div>

                  {week.map((day, dayIndex) =>
                    day ? (
                      <div
                        key={day.key}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={
                          canHover
                            ? (e) =>
                                setTooltip({
                                  day,
                                  x: e.clientX,
                                  y: e.clientY,
                                  problems: day.activity.codingProblemsSolved || 0,
                                  videos: day.activity.videosCompleted || 0,
                                  minutes: day.activity.minutesStudied || 0,
                                })
                            : undefined
                        }
                        onMouseMove={
                          canHover
                            ? (e) =>
                                setTooltip((prev) =>
                                  prev ? { ...prev, x: e.clientX, y: e.clientY } : prev,
                                )
                            : undefined
                        }
                        onMouseLeave={
                          canHover ? () => setTooltip(null) : undefined
                        }
                        className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 hover:scale-125 cursor-pointer outline-none ${getColor(day.activity)}`}
                      />
                    ) : (
                      <div
                        key={`empty-${dayIndex}`}
                        className="w-3.5 h-3.5 rounded bg-transparent"
                      />
                    ),
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800 text-xs text-neutral-400 select-none">
        <span className="text-[11px] text-neutral-400">Consistent effort builds mastery</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-400">Less</span>
          <div title="0 activity" className="w-3 h-3 rounded-sm bg-neutral-800/80 border border-neutral-700/30" />
          <div title="Light activity" className="w-3 h-3 rounded-sm bg-red-500/25 border border-red-500/30" />
          <div title="Medium activity" className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-500/60" />
          <div title="High activity" className="w-3 h-3 rounded-sm bg-red-500 border border-red-400" />
          <div title="Intense activity" className="w-3 h-3 rounded-sm bg-red-400 border border-red-300" />
          <span className="text-[10px] text-neutral-400 ml-0.5">More</span>
        </div>
      </div>

      {canHover &&
        tooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none rounded-xl border border-neutral-700/80 bg-[#121215]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md min-w-[210px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-75"
            style={getTooltipStyles()}
          >
            <p className="font-semibold text-xs text-white pb-1.5 border-b border-neutral-800">
              {tooltip.day.date.toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-neutral-300 flex items-center gap-1.5">
                <span className="text-red-400 font-mono font-medium">💻 {tooltip.problems}</span> coding problem{tooltip.problems === 1 ? "" : "s"} solved
              </p>
              <p className="text-neutral-300 flex items-center gap-1.5">
                <span className="text-red-400 font-mono font-medium">🎬 {tooltip.videos}</span> video{tooltip.videos === 1 ? "" : "s"} watched ({tooltip.minutes} mins)
              </p>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
