import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TypewriterText from "./TypewriterText";

export default function PricingSection() {
  const SHEETS = useMemo(
    () => [
      {
        name: "Blind 75",
        count: "75 Problems",
        desc: "The classic high-yield roadmap covering all essential patterns.",
        difficulty: "Core Patterns",
        tag: "Essential",
        color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
      },
      {
        name: "Striver's SDE Sheet",
        count: "180 Problems",
        desc: "Comprehensive interview curriculum from arrays to dynamic programming.",
        difficulty: "Comprehensive",
        tag: "Interview",
        color: "from-red-500/20 to-rose-500/10 border-red-500/30 text-rose-600 dark:text-rose-400",
      },
      {
        name: "Codeforces Ladder",
        count: "269 Problems",
        desc: "Contest rating ladders (800-1600+) with accepted C++ solutions & 1-click judge forwarding.",
        difficulty: "Rating 800–1600+",
        tag: "Contests",
        color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
        to: "/prephub?subject=codeforces-ladder",
      },
      {
        name: "SQL 75",
        count: "75 Problems",
        desc: "Crucial SQL queries, window functions, and schema problem solving.",
        difficulty: "Queries & Schema",
        tag: "Database",
        color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-cyan-600 dark:text-cyan-400",
      },
    ],
    []
  );

  return (
    <>
      {/* 6. Curated Interview Sheets Showcase */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-[#E04D4D] font-bold mb-2">Curated Roadmaps</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              <TypewriterText text="The Best Coding Sheets In One Place" speed={55} delay={150} />
            </h3>
          </div>
          <Link
            to="/prephub"
            className="mt-4 md:mt-0 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white flex items-center gap-1.5 transition-colors"
          >
            Explore all sheets in Workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SHEETS.map((sheet) => (
            <Link
              key={sheet.name}
              to={sheet.to || "/practice"}
              className="p-5 sm:p-5.5 rounded-2xl bg-white/90 dark:bg-neutral-900/40 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-900/80 hover:-translate-y-1 shadow-xs hover:shadow-lg dark:hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)] transition-all duration-300 group flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-gradient-to-r whitespace-nowrap shrink-0 ${sheet.color}`}>
                    {sheet.tag}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 whitespace-nowrap bg-slate-100 dark:bg-neutral-950/70 border border-slate-200 dark:border-neutral-800/80 px-2 py-0.5 rounded-md shrink-0">
                    {sheet.count}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#E04D4D] transition-colors mb-2">
                  {sheet.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed mb-4">
                  {sheet.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-neutral-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <span className="font-medium text-[11px] text-slate-500 dark:text-neutral-400">{sheet.difficulty}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Free Underdogs Guarantee Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent border border-red-500/25 dark:border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1.5 max-w-xl">
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Zero Paywalls. 100% Free Forever.
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Every algorithm, 3-tier solution, ad-free video player, and daily heatmap is completely free for independent learners everywhere. No credit card, no expiration.
            </p>
          </div>
          <Link
            to="/signup"
            className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-[0_4px_25px_rgba(224,77,77,0.35)] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <span>Join Free Today</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
