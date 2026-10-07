import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../context/ThemeContext";
import Cutout from "../web/Cutout";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Heatmap({ heatmap = {}, days = 365 }) {
  const scrollContainerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const { isWeb } = useTheme();

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

  const getActivityLevel = (activity) => {
    const minutes = activity?.minutesStudied ?? 0;
    const problems = activity?.codingProblemsSolved ?? 0;
    const videos = activity?.videosCompleted ?? 0;

    const score = problems * 2 + (minutes > 0 ? Math.ceil(minutes / 20) : 0) + videos;

    if (score === 0) return 0;
    if (score === 1) return 1;
    if (score <= 3) return 2;
    if (score <= 6) return 3;
    return 4;
  };

  // Color styles for Web theme vs standard theme
  const getCellStyles = (level) => {
    if (!isWeb) {
      const colors = [
        "bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/30",
        "bg-red-500/25 border border-red-500/30",
        "bg-red-500/60 border border-red-500/60",
        "bg-red-500 border border-red-400",
        "bg-red-400 border border-red-300",
      ];
      return { className: colors[level] };
    }

    // Web Theme: Visible #26111a empty grid, 4 crimson levels (#5c2229 to #e5484d), 3px chamfer
    const webColors = [
      { bg: "var(--heat-empty, #26111a)", border: "var(--heat-border-0, rgba(241, 232, 218, 0.12))" }, // Level 0 (Empty)
      { bg: "var(--heat-1, #5c2229)", border: "var(--heat-border-1, rgba(241, 232, 218, 0.18))" }, // Level 1
      { bg: "var(--heat-2, #842b33)", border: "var(--heat-border-2, rgba(241, 232, 218, 0.22))" }, // Level 2
      { bg: "var(--heat-3, #ad343c)", border: "var(--heat-border-3, rgba(241, 232, 218, 0.26))" }, // Level 3
      { bg: "var(--heat-4, #e5484d)", border: "var(--heat-border-4, rgba(241, 232, 218, 0.35))" }, // Level 4
    ];

    const current = webColors[level] || webColors[0];
    return {
      style: {
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        clipPath:
          "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
        WebkitClipPath:
          "polygon(3px 0, calc(100% - 3px) 0, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 0 calc(100% - 3px), 0 3px)",
      },
    };
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

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className={`text-sm font-semibold tracking-[-0.02em] ${
              isWeb ? "text-[var(--bone)]" : "text-slate-900 dark:text-neutral-100"
            }`}
          >
            Activity Heatmap
          </h2>
          <p
            className={`text-[11px] mt-0.5 ${
              isWeb
                ? "font-mono uppercase tracking-[0.08em] text-[var(--bone-muted)]"
                : "text-slate-500 dark:text-neutral-400"
            }`}
          >
            Videos watched and coding problems solved over the past year
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div
          className={`flex flex-col gap-1 text-[11px] shrink-0 select-none pt-6 ${
            isWeb ? "font-mono text-[var(--bone-muted)]" : "text-slate-400 dark:text-neutral-500"
          }`}
        >
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
                  <div
                    className={`h-5 text-[11px] font-medium relative w-4 ${
                      isWeb ? "font-mono text-[var(--text-muted)]" : "text-neutral-400"
                    }`}
                  >
                    {monthLabel && (
                      <span className="absolute left-1/2 -translate-x-1/2 top-0 whitespace-nowrap select-none">
                        {monthLabel}
                      </span>
                    )}
                  </div>

                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${dayIndex}`}
                          className="w-3.5 h-3.5 rounded bg-transparent"
                        />
                      );
                    }

                    const level = getActivityLevel(day.activity);
                    const cellStyle = getCellStyles(level);

                    // Check if consecutive active day with previous day in column
                    const prevInCol = dayIndex > 0 ? week[dayIndex - 1] : null;
                    const prevLevel = prevInCol
                      ? getActivityLevel(prevInCol.activity)
                      : 0;
                    const isConnected = isWeb && level > 0 && prevLevel > 0;

                    return (
                      <div key={day.key} className="relative">
                        {/* Connecting bone thread at 30% opacity for consecutive active days */}
                        {isConnected && (
                          <div
                            aria-hidden="true"
                            className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-[1px] h-[5px] bg-[var(--strand-line,rgba(241,232,218,0.30))] z-10 pointer-events-none"
                          />
                        )}

                        <div
                          role="button"
                          tabIndex={0}
                          onMouseEnter={
                            canHover
                              ? (e) =>
                                  setTooltip({
                                    day,
                                    x: e.clientX,
                                    y: e.clientY,
                                    problems:
                                      day.activity.codingProblemsSolved || 0,
                                    videos: day.activity.videosCompleted || 0,
                                    minutes: day.activity.minutesStudied || 0,
                                  })
                              : undefined
                          }
                          onMouseMove={
                            canHover
                              ? (e) =>
                                  setTooltip((prev) =>
                                    prev
                                      ? { ...prev, x: e.clientX, y: e.clientY }
                                      : prev,
                                  )
                              : undefined
                          }
                          onMouseLeave={
                            canHover ? () => setTooltip(null) : undefined
                          }
                          className={`w-3.5 h-3.5 transition-all duration-150 hover:scale-125 cursor-pointer outline-none ${
                            !isWeb ? "rounded-sm" : ""
                          } ${cellStyle.className || ""}`}
                          style={cellStyle.style}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={`flex items-center justify-between mt-4 pt-3 border-t text-xs select-none ${
          isWeb
            ? "border-[var(--border-subtle,rgba(241,232,218,0.14))] text-[var(--text-muted,#b9a29b)]"
            : "border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400"
        }`}
      >
        <span
          className={`text-[11px] ${
            isWeb ? "font-mono uppercase tracking-[0.06em] text-[var(--text-muted)]" : "text-slate-500 dark:text-neutral-400"
          }`}
        >
          Consistent effort builds mastery
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] ${
              isWeb ? "font-mono text-[var(--text-muted)]" : "text-slate-500 dark:text-neutral-400"
            }`}
          >
            Less
          </span>
          {isWeb ? (
            <>
              <div
                title="0 activity"
                className="w-3 h-3"
                style={{
                  backgroundColor: "var(--heat-empty, #26111a)",
                  border: "1px solid var(--heat-border-0, rgba(241, 232, 218, 0.12))",
                  clipPath:
                    "polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)",
                }}
              />
              <div
                title="Light activity"
                className="w-3 h-3"
                style={{
                  backgroundColor: "var(--heat-1, #5c2229)",
                  border: "1px solid var(--heat-border-1, rgba(241, 232, 218, 0.18))",
                  clipPath:
                    "polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)",
                }}
              />
              <div
                title="Medium activity"
                className="w-3 h-3"
                style={{
                  backgroundColor: "var(--heat-2, #842b33)",
                  border: "1px solid var(--heat-border-2, rgba(241, 232, 218, 0.22))",
                  clipPath:
                    "polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)",
                }}
              />
              <div
                title="High activity"
                className="w-3 h-3"
                style={{
                  backgroundColor: "var(--heat-3, #ad343c)",
                  border: "1px solid var(--heat-border-3, rgba(241, 232, 218, 0.26))",
                  clipPath:
                    "polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)",
                }}
              />
              <div
                title="Intense activity"
                className="w-3 h-3"
                style={{
                  backgroundColor: "var(--heat-4, #e5484d)",
                  border: "1px solid var(--heat-border-4, rgba(241, 232, 218, 0.35))",
                  clipPath:
                    "polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)",
                }}
              />
            </>
          ) : (
            <>
              <div
                title="0 activity"
                className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-neutral-800/80 border border-slate-200 dark:border-neutral-700/30"
              />
              <div
                title="Light activity"
                className="w-3 h-3 rounded-sm bg-red-500/25 border border-red-500/30"
              />
              <div
                title="Medium activity"
                className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-500/60"
              />
              <div
                title="High activity"
                className="w-3 h-3 rounded-sm bg-red-500 border border-red-400"
              />
              <div
                title="Intense activity"
                className="w-3 h-3 rounded-sm bg-red-400 border border-red-300"
              />
            </>
          )}
          <span
            className={`text-[10px] ml-0.5 ${
              isWeb ? "font-mono text-[var(--text-muted)]" : "text-slate-500 dark:text-neutral-400"
            }`}
          >
            More
          </span>
        </div>
      </div>

      {canHover &&
        tooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`fixed z-[9999] pointer-events-none px-3.5 py-2.5 shadow-2xl backdrop-blur-md min-w-[210px] whitespace-nowrap animate-in fade-in zoom-in-95 duration-75 ${
              isWeb
                ? "bg-[var(--surface-card)] text-[var(--bone)] border border-[var(--border-strong)]"
                : "rounded-xl border border-neutral-700/80 bg-[#121215]/95 text-white"
            }`}
            style={{
              ...getTooltipStyles(),
              clipPath: isWeb
                ? "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)"
                : undefined,
            }}
          >
            <p
              className={`font-semibold text-xs pb-1.5 border-b ${
                isWeb
                  ? "border-[var(--border-subtle)] text-[var(--bone)] font-mono"
                  : "border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white"
              }`}
            >
              {tooltip.day.date.toLocaleDateString(undefined, {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <div className="mt-2 space-y-1 text-xs">
              <p
                className={`flex items-center gap-1.5 ${
                  isWeb ? "text-[var(--bone-muted)]" : "text-slate-600 dark:text-neutral-300"
                }`}
              >
                <span className="text-[var(--crimson-hover)] font-mono font-medium">
                  💻 {tooltip.problems}
                </span>{" "}
                coding problem{tooltip.problems === 1 ? "" : "s"} solved
              </p>
              <p
                className={`flex items-center gap-1.5 ${
                  isWeb ? "text-[var(--bone-muted)]" : "text-slate-600 dark:text-neutral-300"
                }`}
              >
                <span className="text-[var(--crimson-hover)] font-mono font-medium">
                  🎬 {tooltip.videos}
                </span>{" "}
                video{tooltip.videos === 1 ? "" : "s"} watched ({tooltip.minutes}{" "}
                mins)
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );

  if (isWeb) {
    return (
      <Cutout variant="card" className="w-full" innerClassName="p-6">
        {content}
      </Cutout>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 w-full shadow-xs dark:shadow-none backdrop-blur-sm">
      {content}
    </div>
  );
}
