import { Link } from "react-router-dom";
import { Terminal, Play, BookOpen, Sun, Moon, ArrowRight, Code2 } from "lucide-react";
import Logo from "../common/Logo";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import TypewriterText from "./TypewriterText";

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  const { isWeb, isDark, toggleTheme, toggleSkin } = useTheme();

  return (
    <>
      {/* 1. Glassmorphism Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-slate-200/90 dark:border-neutral-800/80 bg-white/90 dark:bg-[#030005]/85 backdrop-blur-xl shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group py-0.5">
            <Logo size="md" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-neutral-100">
                  StudyBuddy
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-[#E04D4D] border border-red-500/25">
                  2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium tracking-wide">
                Code • Study • Track
              </span>
            </div>
          </Link>

          {/* Apple Notch / Dynamic Island Navigation Capsule */}
          <nav className="hidden md:flex items-center p-1 rounded-full bg-slate-100/90 dark:bg-neutral-950/85 border border-slate-200/90 dark:border-neutral-800/90 shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            <Link
              to="/practice"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800/80 rounded-full transition-all flex items-center gap-2 group"
            >
              <Terminal className="w-3.5 h-3.5 text-[#E04D4D] group-hover:scale-110 transition-transform" />
              <span>Practice DSA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600 border border-slate-300 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 group-hover:border-slate-400 dark:group-hover:border-neutral-700">
                15,600+
              </span>
            </Link>

            <span className="w-[1px] h-3.5 bg-slate-300/80 dark:bg-neutral-800/90 my-auto"></span>

            <Link
              to="/youtube"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800/80 rounded-full transition-all flex items-center gap-2 group"
            >
              <Play className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
              <span>Ad - free Video</span>
            </Link>

            <span className="w-[1px] h-3.5 bg-slate-300/80 dark:bg-neutral-800/90 my-auto"></span>

            <Link
              to="/prephub"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800/80 rounded-full transition-all flex items-center gap-2 group"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Workspace</span>
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Skin Toggle Button */}
            <button
              type="button"
              onClick={toggleSkin}
              aria-label="Toggle visual skin"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
              title={isWeb ? "Web Skin (Active) — Click to switch to Basic Skin" : "Basic Skin (Active) — Click to switch to Web Skin"}
            >
              <span
                className={`text-sm leading-none select-none transition-all duration-200 inline-block ${
                  isWeb
                    ? "opacity-90 drop-shadow-[0_0_6px_rgba(224,77,77,0.4)] scale-105"
                    : "opacity-40 grayscale hover:opacity-75"
                }`}
              >
                🕸️
              </span>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#E04D4D]" />
              )}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] !text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-[0_2px_15px_rgba(224,77,77,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <span className="!text-white">Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 !text-white" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] !text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-[0_2px_15px_rgba(224,77,77,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <span className="!text-white">Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5 !text-white" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="h-16 w-full shrink-0" aria-hidden="true" />

      {/* 2. Hero Section (Above the Fold) */}
      <section className="relative z-10 w-full flex flex-col items-center text-center max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pt-4 pb-8 sm:pt-6 sm:pb-10 md:pt-8 md:pb-12">
        <div className="w-full flex flex-col items-center max-w-4xl mx-auto">
          {/* Glow Tag — Underdogs Identity */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-slate-100/90 dark:bg-neutral-900/80 border border-slate-300/80 dark:border-neutral-800 px-3 sm:px-4 py-1.5 rounded-2xl sm:rounded-full text-xs sm:text-sm font-medium tracking-wide text-slate-700 dark:text-neutral-300 mb-3 sm:mb-4 lg:mb-5 backdrop-blur-md shadow-xs dark:shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-[fadeInUp_0.6s_ease-out_both] max-w-full">
            <span className="text-sm sm:text-base select-none">🥊</span>
            <span className="whitespace-nowrap">100% Free •</span>
            <span className="font-bold bg-gradient-to-r from-[#F26464] via-[#E04D4D] to-orange-400 bg-clip-text text-transparent text-center">
              Built for underdogs defying the odds
            </span>
            <span className="text-slate-400 dark:text-neutral-600 hidden sm:inline">•</span>
            <span className="text-[11px] text-amber-700 dark:text-amber-300/90 font-mono hidden sm:inline">Premium Modules for RK Coaching Students</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] font-extrabold tracking-tight max-w-5xl leading-[1.18] sm:leading-[1.15] text-slate-900 dark:text-white mb-2.5 sm:mb-3.5 lg:mb-4 animate-[fadeInUp_0.7s_ease-out_both] [animation-delay:100ms]">
            <span className="block lg:whitespace-nowrap">Master Algorithms. Conquer Courses.</span>
            <span className="block mt-0.5 sm:mt-1 lg:whitespace-nowrap">
              <span className="text-slate-800 dark:text-neutral-100">Stream YouTube. </span>
              <span className="bg-gradient-to-r from-[#F26464] via-[#E04D4D] to-[#BA3C3C] bg-clip-text text-transparent">
                <TypewriterText text="Zero Distractions." speed={75} delay={600} />
              </span>
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed mb-3.5 sm:mb-5 lg:mb-6 animate-[fadeInUp_0.7s_ease-out_both] [animation-delay:180ms]">
            <span className="text-[#E04D4D] font-semibold">15,600+ coding challenges</span> across LeetCode & Codeforces. 4,179+ curated 3-tier solutions (Brute, Better, Optimal), 1-click judge forwarder, ad-free YouTube playlist tracker, and daily coding heatmaps.
          </p>

          {/* Platform Metrics Dock */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-3xl mx-auto p-1.5 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-neutral-950/80 border border-slate-200/90 dark:border-neutral-800/90 backdrop-blur-2xl shadow-md dark:shadow-[0_4px_30px_rgba(0,0,0,0.6)] mb-3.5 sm:mb-5 lg:mb-7 animate-[fadeInUp_0.7s_ease-out_both] [animation-delay:260ms]">
            <div className="flex flex-col items-center py-1.5 sm:py-2.5 px-2.5 sm:px-3 border-r border-slate-200/90 dark:border-neutral-800/60 hover:bg-slate-100/70 dark:hover:bg-neutral-900/60 rounded-xl transition-all duration-200 cursor-default">
              <span className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">15,600+</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Practice Catalog</span>
            </div>
            <div className="flex flex-col items-center py-1.5 sm:py-2.5 px-2.5 sm:px-3 border-r border-slate-200/90 dark:border-neutral-800/60 hover:bg-slate-100/70 dark:hover:bg-neutral-900/60 rounded-xl transition-all duration-200 cursor-default">
              <span className="text-base sm:text-lg md:text-xl font-extrabold text-[#E04D4D] tracking-tight">4,179+</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 font-medium">3-Tier Solutions</span>
            </div>
            <div className="flex flex-col items-center py-1.5 sm:py-2.5 px-2.5 sm:px-3 border-r border-slate-200/90 dark:border-neutral-800/60 hover:bg-slate-100/70 dark:hover:bg-neutral-900/60 rounded-xl transition-all duration-200 cursor-default">
              <span className="text-base sm:text-lg md:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">100%</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Ad - free Video</span>
            </div>
            <div className="flex flex-col items-center py-1.5 sm:py-2.5 px-2.5 sm:px-3 hover:bg-slate-100/70 dark:hover:bg-neutral-900/60 rounded-xl transition-all duration-200 cursor-default text-center">
              <span className="text-base sm:text-lg md:text-xl font-extrabold text-amber-500 dark:text-amber-400 tracking-tight">1-Click</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Judge Forwarder</span>
            </div>
          </div>

          {/* CTA Button Group */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-3.5 w-full sm:w-auto animate-[fadeInUp_0.7s_ease-out_both] [animation-delay:340ms]">
            <Link
              to={isAuthenticated ? "/practice" : "/signup"}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] border border-red-400/20 px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-[0_4px_25px_rgba(224,77,77,0.35)] hover:shadow-[0_4px_35px_rgba(224,77,77,0.5)] hover:brightness-110 active:scale-[0.98] transition-all duration-300"
            >
              <Code2 className="w-4 h-4" />
              <span>Start Practicing Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/youtube"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900/90 dark:hover:bg-neutral-800/90 border border-slate-300 hover:border-slate-400 dark:border-neutral-800 dark:hover:border-neutral-700 px-6 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-800 dark:text-neutral-200 transition-all active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span>Explore Ad - free Video</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
