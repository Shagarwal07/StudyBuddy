import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Terminal,
  Play,
  Flame,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import TypewriterText from "./TypewriterText";

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  const CORE_FEATURES = useMemo(
    () => [
      {
        id: "practice",
        num: "01",
        title: "Practice & Solution Studio",
        desc: "15,600+ problems across LeetCode & Codeforces with 3-tier solutions & judge forwarder.",
        billuTip: "4,179+ LeetCode problems with Brute, Better, Optimal code + 11,400+ Codeforces catalog!",
        path: "/practice",
        icon: Terminal,
        badgeText: "Solution Studio",
        color: "emerald",
        numColor: "text-emerald-600 dark:text-emerald-400",
        iconStyle:
          "bg-emerald-100/80 border-emerald-200 text-emerald-600 shadow-xs dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]",
        activeRow:
          "bg-emerald-50/90 border-emerald-300 shadow-[0_4px_24px_rgba(16,185,129,0.15)] dark:border-emerald-500/50 dark:bg-gradient-to-r dark:from-emerald-950/50 dark:via-neutral-900/95 dark:to-neutral-900/80 dark:shadow-[0_4px_30px_rgba(16,185,129,0.2)]",
        defaultRow:
          "bg-white/90 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-xs dark:border-emerald-500/20 dark:bg-gradient-to-r dark:from-emerald-950/20 dark:via-neutral-950/70 dark:to-neutral-950/50 dark:hover:border-emerald-500/45 dark:hover:bg-neutral-900/80",
        activeArrow:
          "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400/50 text-[#ffffff] shadow-[0_0_18px_rgba(16,185,129,0.35)] dark:shadow-[0_0_18px_rgba(16,185,129,0.5)]",
        defaultArrow:
          "bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-emerald-500 group-hover:text-[#ffffff] group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:group-hover:bg-emerald-500 dark:group-hover:text-[#ffffff] dark:group-hover:border-emerald-400 dark:group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        billuGlow: "from-emerald-500/20 via-teal-500/20 to-emerald-500/10",
        bubbleBorder:
          "border-emerald-200 shadow-[0_8px_20px_rgba(16,185,129,0.12)] dark:border-emerald-500/40 dark:shadow-[0_10px_30px_rgba(16,185,129,0.2)]",
      },
      {
        id: "roadmaps",
        num: "02",
        title: "Custom Targeted Roadmaps",
        desc: "Personalized study paths, Striver 79, Blind 75, and NeetCode 150 at your pace.",
        billuTip: "Pick your dream company roadmap, and I'll keep your algorithmic milestones locked in!",
        path: "/prephub",
        icon: BookOpen,
        badgeText: "Curated Roadmaps",
        color: "amber",
        numColor: "text-amber-600 dark:text-amber-400",
        iconStyle:
          "bg-amber-100/80 border-amber-200 text-amber-600 shadow-xs dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-400 dark:shadow-[0_0_12px_rgba(245,158,11,0.25)]",
        activeRow:
          "bg-amber-50/90 border-amber-300 shadow-[0_4px_24px_rgba(245,158,11,0.15)] dark:border-amber-500/50 dark:bg-gradient-to-r dark:from-amber-950/50 dark:via-neutral-900/95 dark:to-neutral-900/80 dark:shadow-[0_4px_30px_rgba(245,158,11,0.2)]",
        defaultRow:
          "bg-white/90 border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 shadow-xs dark:border-amber-500/20 dark:bg-gradient-to-r dark:from-amber-950/20 dark:via-neutral-950/70 dark:to-neutral-950/50 dark:hover:border-amber-500/45 dark:hover:bg-neutral-900/80",
        activeArrow:
          "bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400/50 text-[#ffffff] shadow-[0_0_18px_rgba(245,158,11,0.35)] dark:shadow-[0_0_18px_rgba(245,158,11,0.5)]",
        defaultArrow:
          "bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-amber-500 group-hover:text-[#ffffff] group-hover:border-amber-400 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:group-hover:bg-amber-500 dark:group-hover:text-[#ffffff] dark:group-hover:border-amber-400 dark:group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        billuGlow: "from-amber-500/20 via-orange-500/20 to-amber-500/10",
        bubbleBorder:
          "border-amber-200 shadow-[0_8px_20px_rgba(245,158,11,0.12)] dark:border-amber-500/40 dark:shadow-[0_10px_30px_rgba(245,158,11,0.2)]",
      },
      {
        id: "youtube",
        num: "03",
        title: "Ad - free Video",
        desc: "Stream YouTube playlists with zero ads, zero shorts, and time-synced markdown notes.",
        billuTip: "Zero distraction rabbit holes, no sponsored ads — pure lecture focus with synced notes!",
        path: "/youtube",
        icon: Play,
        badgeText: "Ad - free Video",
        color: "red",
        numColor: "text-red-600 dark:text-rose-400",
        iconStyle:
          "bg-red-100/80 border-red-200 text-red-600 shadow-xs dark:bg-red-500/15 dark:border-red-500/30 dark:text-rose-400 dark:shadow-[0_0_12px_rgba(239,68,68,0.25)]",
        activeRow:
          "bg-red-50/90 border-red-300 shadow-[0_4px_24px_rgba(239,68,68,0.15)] dark:border-red-500/50 dark:bg-gradient-to-r dark:from-red-950/50 dark:via-neutral-900/95 dark:to-neutral-900/80 dark:shadow-[0_4px_30px_rgba(239,68,68,0.2)]",
        defaultRow:
          "bg-white/90 border-slate-200 hover:border-red-300 hover:bg-red-50/40 shadow-xs dark:border-red-500/20 dark:bg-gradient-to-r dark:from-red-950/20 dark:via-neutral-950/70 dark:to-neutral-950/50 dark:hover:border-red-500/45 dark:hover:bg-neutral-900/80",
        activeArrow:
          "bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] border-red-400/50 text-[#ffffff] shadow-[0_0_18px_rgba(224,77,77,0.35)] dark:shadow-[0_0_18px_rgba(224,77,77,0.5)]",
        defaultArrow:
          "bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-[#E04D4D] group-hover:text-[#ffffff] group-hover:border-red-400 group-hover:shadow-[0_0_15px_rgba(224,77,77,0.3)] dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:group-hover:bg-[#E04D4D] dark:group-hover:text-[#ffffff] dark:group-hover:border-red-400 dark:group-hover:shadow-[0_0_15px_rgba(224,77,77,0.4)]",
        billuGlow: "from-red-500/20 via-rose-500/20 to-red-500/10",
        bubbleBorder:
          "border-red-200 shadow-[0_8px_20px_rgba(224,77,77,0.12)] dark:border-red-500/40 dark:shadow-[0_10px_30px_rgba(224,77,77,0.2)]",
      },
      {
        id: "dashboard",
        num: "04",
        title: "Momentum & Activity Heatmaps",
        desc: "GitHub-style daily activity grid, streak analytics, and interview conquest metrics.",
        billuTip: "Consistency beats intensity! Fill your daily heatmap green and watch your confidence soar.",
        path: "/dashboard",
        icon: Flame,
        badgeText: "Activity Heatmaps",
        color: "purple",
        numColor: "text-purple-600 dark:text-purple-400",
        iconStyle:
          "bg-purple-100/80 border-purple-200 text-purple-600 shadow-xs dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-400 dark:shadow-[0_0_12px_rgba(168,85,247,0.25)]",
        activeRow:
          "bg-purple-50/90 border-purple-300 shadow-[0_4px_24px_rgba(168,85,247,0.15)] dark:border-purple-500/50 dark:bg-gradient-to-r dark:from-purple-950/50 dark:via-neutral-900/95 dark:to-neutral-900/80 dark:shadow-[0_4px_30px_rgba(168,85,247,0.2)]",
        defaultRow:
          "bg-white/90 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 shadow-xs dark:border-purple-500/20 dark:bg-gradient-to-r dark:from-purple-950/20 dark:via-neutral-950/70 dark:to-neutral-950/50 dark:hover:border-purple-500/45 dark:hover:bg-neutral-900/80",
        activeArrow:
          "bg-gradient-to-r from-purple-600 to-indigo-500 border-purple-400/50 text-[#ffffff] shadow-[0_0_18px_rgba(168,85,247,0.35)] dark:shadow-[0_0_18px_rgba(168,85,247,0.5)]",
        defaultArrow:
          "bg-slate-100 border-slate-200 text-slate-500 group-hover:bg-purple-500 group-hover:text-[#ffffff] group-hover:border-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:group-hover:bg-purple-500 dark:group-hover:text-[#ffffff] dark:group-hover:border-purple-400 dark:group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        billuGlow: "from-purple-500/20 via-indigo-500/20 to-purple-500/10",
        bubbleBorder:
          "border-purple-200 shadow-[0_8px_20px_rgba(168,85,247,0.12)] dark:border-purple-500/40 dark:shadow-[0_10px_30px_rgba(168,85,247,0.2)]",
      },
    ],
    []
  );

  return (
    <>
      {/* 50% Centered Red Accent Line Divider */}
      <div className="relative z-10 w-full flex justify-center py-4">
        <div className="w-1/2 max-w-2xl h-[2px] bg-gradient-to-r from-transparent via-[#E04D4D] to-transparent rounded-full shadow-[0_0_12px_rgba(224,77,77,0.45)] animate-[dividerGlow_3.5s_ease-in-out_infinite]" />
      </div>

      {/* 5. The 4 Pillars of StudyBuddy */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-10 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase tracking-widest text-[#E04D4D] font-bold mb-2">
            Built by the serious • For the serious • To be the serious
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            <TypewriterText text="Code, Study, and Track in Harmony." speed={55} delay={150} />
          </h3>
          <p className="text-slate-600 dark:text-neutral-400 text-sm sm:text-base mt-3">
            Stop switching between YouTube tabs, scattered LeetCode bookmarks, and disorganized notes.
          </p>
        </div>

        {/* 2-Column Split: Creative Billu on Left, Headings with Arrows on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Creative Billu Mascot Presentation */}
          <div className="lg:col-span-5 flex flex-col items-center text-center relative">
            <div
              className={`relative mb-3 px-5 py-3.5 rounded-2xl bg-white/95 dark:bg-neutral-900/95 border backdrop-blur-md max-w-sm transition-all duration-300 ${CORE_FEATURES[activeFeature].bubbleBorder}`}
            >
              <p className="text-xs text-slate-800 dark:text-neutral-200 font-medium leading-relaxed transition-all duration-300">
                "{CORE_FEATURES[activeFeature].billuTip}"
              </p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-neutral-900 border-r border-b border-inherit rotate-45" />
            </div>

            <div className="relative w-56 h-64 sm:w-64 sm:h-72 flex items-center justify-center rounded-3xl bg-gradient-to-b from-indigo-50/70 via-slate-100/40 to-transparent dark:from-[#2a0b12]/40 dark:via-[#160509]/30 dark:to-transparent border border-slate-200/70 dark:border-red-950/40">
              <div
                className={`absolute inset-4 rounded-full bg-gradient-to-tr ${CORE_FEATURES[activeFeature].billuGlow} blur-2xl pointer-events-none transition-all duration-500 opacity-60 dark:opacity-100`}
              />
              <img
                src="/assets/billu-mascot-3d.png"
                alt="Billu the Fox Mascot"
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] animate-[floatSlow_4s_ease-in-out_infinite]"
              />
              <div className="absolute bottom-2.5 w-40 h-3 rounded-[100%] bg-slate-900/30 dark:bg-black/95 blur-[2px] pointer-events-none" />
              <div className="absolute bottom-1 w-52 h-6 rounded-[100%] bg-slate-900/20 dark:bg-black/70 blur-md pointer-events-none" />
              <div
                className={`absolute -bottom-0.5 w-48 h-6 rounded-[100%] bg-gradient-to-r ${CORE_FEATURES[activeFeature].billuGlow} blur-lg opacity-40 dark:opacity-50 pointer-events-none transition-all duration-500`}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/90 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 shadow-xs dark:shadow-none text-[10px] font-mono text-slate-600 dark:text-neutral-400">
              <span className="text-sm">🦊</span>
              <span className="font-semibold text-slate-900 dark:text-neutral-200">Billu</span>
              <span className="text-slate-400 dark:text-neutral-600">•</span>
              <span className="text-[#C23333] dark:text-[#E04D4D] font-bold">Chief Mentor</span>
            </div>
          </div>

          {/* Right Column: Headings One by One with Arrows */}
          <div className="lg:col-span-7 flex flex-col gap-2.5">
            {CORE_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = activeFeature === idx;
              return (
                <Link
                  key={feat.id}
                  to={feat.path}
                  onMouseEnter={() => setActiveFeature(idx)}
                  className={`group relative rounded-xl border transition-all duration-300 py-3 px-3.5 sm:py-3.5 sm:px-4 flex items-center justify-between gap-3.5 select-none ${
                    isActive ? feat.activeRow + " translate-x-1" : feat.defaultRow
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border flex items-center justify-center transition-all duration-300 ${feat.iconStyle}`}
                    >
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>

                    <div className="flex flex-col text-left truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-mono font-bold ${feat.numColor}`}>
                          {feat.num}
                        </span>
                        <h4
                          className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                            isActive
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-800 group-hover:text-slate-900 dark:text-neutral-100 dark:group-hover:text-white"
                          }`}
                        >
                          {feat.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-neutral-400 truncate mt-0.5">
                        {feat.desc}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-8 h-8 sm:w-8.5 sm:h-8.5 shrink-0 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                      isActive ? feat.activeArrow : feat.defaultArrow
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
