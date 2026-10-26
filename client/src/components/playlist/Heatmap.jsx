import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import Cutout from "../web/Cutout";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Heatmap({ heatmap = {} }) {
  const scrollContainerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [timeframe, setTimeframe] = useState("1y"); // "1y" (fills full card) | "6m"

  const daysCount = timeframe === "1y" ? 365 : 182;

  const canHover = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover)").matches;
  }, []);

  const { weeks, monthStartIndices } = useMemo(() => {
    const allDays = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dayNum = String(date.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${dayNum}`;
      const fallbackKey = date.toLocaleDateString("en-CA");

      const activityData = heatmap[key] || heatmap[fallbackKey] || {
        videosCompleted: 0,
        minutesStudied: 0,
        codingProblemsSolved: 0,
      };

      allDays.push({
        date,
        key,
        activity: activityData,
      });
    }

    // Pad beginning of first week to start on Monday (index 0)
    const firstDayOfWeek = (allDays[0].date.getDay() + 6) % 7;
    for (let i = 0; i < firstDayOfWeek; i++) {
      allDays.unshift(null);
    }

    // Pad end of last week to complete the 7-day column
    while (allDays.length % 7 !== 0) {
      allDays.push(null);
    }

    const weeksList = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeksList.push(allDays.slice(i, i + 7));
    }

    // High-precision month placement:
    // Place month label at the week column where a new month starts.
    // Suppress if too close to avoid label collisions.
    const monthIndices = new Map();
    let lastMonth = -1;
    let lastLabeledWeek = -99;

    weeksList.forEach((week, weekIdx) => {
      const validDays = week.filter((d) => d !== null);
      if (validDays.length === 0) return;

      const newMonthDay = validDays.find(
        (d) => d.date.getDate() <= 7 && d.date.getMonth() !== lastMonth
      );

      if (weekIdx === 0) {
        lastMonth = validDays[0].date.getMonth();
      } else if (newMonthDay) {
        const monthNum = newMonthDay.date.getMonth();
        if (weekIdx - lastLabeledWeek >= 3) {
          monthIndices.set(weekIdx, MONTH_NAMES[monthNum]);
          lastLabeledWeek = weekIdx;
        }
        lastMonth = monthNum;
      }
    });

    // Check if initial week 0 should show its month label (only if at least 3 weeks from next label)
    if (weeksList.length > 0 && !monthIndices.has(0)) {
      const firstValidDay = weeksList[0].find((d) => d !== null);
      if (firstValidDay) {
        const firstLabeledIdx = Math.min(
          ...Array.from(monthIndices.keys()),
          999
        );
        if (firstLabeledIdx >= 3) {
          monthIndices.set(0, MONTH_NAMES[firstValidDay.date.getMonth()]);
        }
      }
    }

    return {
      weeks: weeksList,
      monthStartIndices: monthIndices,
    };
  }, [heatmap, daysCount]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [weeks.length]);

  const getActivityLevel = (activity) => {
    const minutes = activity?.minutesStudied ?? 0;
    const problems = activity?.codingProblemsSolved ?? 0;
    const videos = activity?.videosCompleted ?? 0;

    const score =
      problems * 2 + (minutes > 0 ? Math.ceil(minutes / 20) : 0) + videos;

    if (score === 0) return 0;
    if (score === 1) return 1;
    if (score <= 3) return 2;
    if (score <= 6) return 3;
    return 4;
  };

  // Clean, subtle red shades without harsh/excessive glowing
  const getCellClasses = (level) => {
    switch (level) {
      case 1:
        return "bg-[#3a151b] border border-[#521c24] hover:border-red-400";
      case 2:
        return "bg-[#661e27] border border-[#852733] hover:border-red-400";
      case 3:
        return "bg-[#992632] border border-[#bd2f3e] hover:border-red-300";
      case 4:
        return "bg-[#e53844] border border-[#ff5c67] shadow-[0_0_6px_rgba(229,56,68,0.4)] hover:brightness-110";
      default:
        return "bg-[#140e11] border border-[#21161b] hover:border-neutral-700";
    }
  };

  const getTooltipStyles = () => {
    if (!tooltip || typeof window === "undefined") return {};

    const OFFSET = 12;
    const isNearRightEdge = tooltip.x > window.innerWidth - 240;
    const isNearBottomEdge = tooltip.y > window.innerHeight - 80;

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

  const formatTooltipDate = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const content = (
    <div className="flex flex-col h-full justify-between gap-3">
      {/* Header: Title + Subtitle on Left, Controls (Timeframe + Legend) on Right */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-theme-main tracking-tight">
            Activity Heatmap
          </h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-theme-muted mt-0.5">
            VIDEOS WATCHED AND CODING PROBLEMS SOLVED, {timeframe === "1y" ? "PAST YEAR" : "PAST 6 MONTHS"}
          </p>
        </div>

        {/* Right Controls: Timeframe Switch + Less ... More Legend */}
        <div className="flex items-center gap-3 select-none shrink-0">
          {/* Timeframe Toggle */}
          <div className="flex items-center bg-[var(--surface-hover)] p-0.5 rounded border border-[var(--border-subtle)] text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setTimeframe("6m")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                timeframe === "6m"
                  ? "bg-red-600 !text-white font-bold shadow-xs"
                  : "text-theme-muted hover:text-theme-main"
              }`}
            >
              6M
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("1y")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                timeframe === "1y"
                  ? "bg-red-600 !text-white font-bold shadow-xs"
                  : "text-theme-muted hover:text-theme-main"
              }`}
            >
              1Y
            </button>
          </div>

          {/* Less ... More Legend */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-theme-muted">Less</span>
            <div
              title="0 activity"
              className="w-2.5 h-2.5 rounded-[2px] bg-[#140e11] border border-[#21161b]"
            />
            <div
              title="Light activity"
              className="w-2.5 h-2.5 rounded-[2px] bg-[#3a151b] border border-[#521c24]"
            />
            <div
              title="Medium activity"
              className="w-2.5 h-2.5 rounded-[2px] bg-[#661e27] border border-[#852733]"
            />
            <div
              title="High activity"
              className="w-2.5 h-2.5 rounded-[2px] bg-[#992632] border border-[#bd2f3e]"
            />
            <div
              title="Intense activity"
              className="w-2.5 h-2.5 rounded-[2px] bg-[#e53844] border border-[#ff5c67] shadow-[0_0_4px_rgba(229,56,68,0.4)]"
            />
            <span className="text-[10px] font-mono text-theme-muted">More</span>
          </div>
        </div>
      </div>

      {/* Grid: Pixel-Perfect Aligned Day Labels + Month Headers + Full-Width Weeks Grid */}
      <div className="flex gap-2 pt-1 min-w-0">
        {/* Day Labels Column: Exact vertical row alignment */}
        <div className="flex flex-col shrink-0 select-none font-mono">
          {/* Header spacer matches the month labels row height (h-4) */}
          <div className="h-4" />

          {/* 7 Day labels matching cell height and row gap */}
          <div className="flex flex-col gap-1 sm:gap-1.5 text-theme-muted">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="h-3 sm:h-3.5 flex items-center justify-end font-medium text-[9px] sm:text-[10px] leading-none pr-1.5 text-theme-muted select-none"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable & Full-Width Weeks Grid (Eliminates leftover empty space) */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto flex-1 min-w-0 pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-neutral-950 [&::-webkit-scrollbar-thumb]:bg-neutral-800 [&::-webkit-scrollbar-thumb]:rounded-full"
        >
          <div
            className={`flex gap-1 sm:gap-1.5 ${
              timeframe === "1y" ? "w-full justify-between" : "w-max"
            }`}
          >
            {weeks.map((week, weekIndex) => {
              const monthLabel = monthStartIndices.get(weekIndex);

              return (
                <div
                  key={weekIndex}
                  className={`flex flex-col gap-1 sm:gap-1.5 ${
                    timeframe === "1y"
                      ? "flex-1 min-w-[10px] max-w-[15px]"
                      : "w-3 sm:w-3.5"
                  }`}
                >
                  {/* Month Label Header: Placed at the week column where month starts */}
                  <div className="h-4 text-[10px] font-mono text-theme-muted relative">
                    {monthLabel && (
                      <span className="absolute left-0 top-0 whitespace-nowrap select-none font-medium text-theme-muted">
                        {monthLabel}
                      </span>
                    )}
                  </div>

                  {/* Day Cells in this week column */}
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${dayIndex}`}
                          className="w-full aspect-square rounded-[2px] bg-transparent"
                        />
                      );
                    }

                    const level = getActivityLevel(day.activity);
                    const colorClass = getCellClasses(level);

                    return (
                      <div
                        key={day.key}
                        onMouseEnter={(e) => {
                          if (!canHover) return;
                          const minutes = day.activity.minutesStudied || 0;
                          const problems =
                            day.activity.codingProblemsSolved || 0;
                          const videos = day.activity.videosCompleted || 0;

                          setTooltip({
                            x: e.clientX,
                            y: e.clientY,
                            day,
                            minutes,
                            problems,
                            videos,
                          });
                        }}
                        onMouseMove={(e) => {
                          if (tooltip && canHover) {
                            setTooltip((prev) =>
                              prev
                                ? { ...prev, x: e.clientX, y: e.clientY }
                                : null
                            );
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        className={`w-full aspect-square rounded-[2px] transition-colors duration-100 cursor-pointer ${colorClass}`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Single-Line HUD Tooltip */}
      {canHover &&
        tooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none px-3 py-1.5 rounded-lg border border-red-500/30 bg-[#0e0a0d]/95 backdrop-blur-md text-neutral-200 shadow-xl shadow-black/90 font-mono text-xs flex items-center gap-1.5 whitespace-nowrap animate-in fade-in duration-75"
            style={getTooltipStyles()}
          >
            <span className="font-semibold text-white">
              {formatTooltipDate(tooltip.day.date)}
            </span>
            <span className="text-red-500 font-bold">•</span>
            {tooltip.problems === 0 &&
            tooltip.minutes === 0 &&
            tooltip.videos === 0 ? (
              <span className="text-neutral-400">No activity recorded</span>
            ) : (
              <>
                {tooltip.problems > 0 && (
                  <span>
                    {tooltip.problems} problem{tooltip.problems === 1 ? "" : "s"}
                  </span>
                )}
                {tooltip.problems > 0 &&
                  (tooltip.minutes > 0 || tooltip.videos > 0) && (
                    <span className="text-red-500 font-bold">•</span>
                  )}
                {tooltip.minutes > 0 && <span>{tooltip.minutes} min</span>}
                {tooltip.minutes > 0 && tooltip.videos > 0 && (
                  <span className="text-red-500 font-bold">•</span>
                )}
                {tooltip.videos > 0 && (
                  <span>
                    {tooltip.videos} video{tooltip.videos === 1 ? "" : "s"}
                  </span>
                )}
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );

  return (
    <Cutout
      variant="card-tr"
      className="w-full h-full min-w-0"
      innerClassName="p-5 sm:p-6 bg-[#0c080a]/90 border border-red-950/40 h-full flex flex-col justify-between min-w-0 overflow-hidden"
    >
      <div className="w-full h-full min-w-0">{content}</div>
    </Cutout>
  );
}

