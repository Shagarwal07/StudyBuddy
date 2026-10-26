import { Link } from "react-router-dom";
import {
  GraduationCap,
  Star,
  ArrowRight,
  Terminal,
  Play,
  BookOpen,
  Flame,
  ExternalLink,
  Code2,
  Heart,
} from "lucide-react";

export default function FooterSection() {
  return (
    <>
      {/* 50% Centered Red Accent Line Divider */}
      <div className="relative z-10 w-full flex justify-center py-6">
        <div className="w-1/2 max-w-2xl h-[2px] bg-gradient-to-r from-transparent via-[#E04D4D] to-transparent rounded-full shadow-[0_0_12px_rgba(224,77,77,0.45)] animate-[dividerGlow_3.5s_ease-in-out_infinite]" />
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-neutral-900/60 bg-slate-100/90 dark:bg-[#030005] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-16 pb-10 border-b border-slate-200 dark:border-neutral-900">
            {/* Left: Powered by RK COACHING CLASSES */}
            <div className="max-w-xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-[#E04D4D] text-[10px] font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Academic & Institutional Patron</span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-neutral-400 font-semibold block mb-1">
                  Powered by
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  RK COACHING CLASSES
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed max-w-md">
                A premier academic institution and family business in Balotra, Rajasthan — dedicated to igniting curiosity, mathematical rigor, and student excellence for more than ten years.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Balotra, Rajasthan
                </span>
                <span className="text-slate-300 dark:text-neutral-700">•</span>
                <span>Family-Run Academic Legacy</span>
                <span className="text-slate-300 dark:text-neutral-700">•</span>
                <span>10+ Years of Proven Mentorship</span>
              </div>

              {/* Verified Google Reviews Button */}
              <div className="pt-3">
                <a
                  href="https://www.google.com/search?kgmid=/g/11sw3lygl4&hl=en-IN&q=R.K+Coaching+Classes&shem=epsd1,ltae&shndl=30&source=sh/x/loc/osrp/m1/4&kgs=b766ce970394304d&utm_source=epsd1,ltae,sh/x/loc/osrp/m1/4&zx=1790988522881"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white dark:bg-[#080d1a] border border-amber-500/40 dark:border-blue-900/80 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-[#0c1324] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] active:scale-[0.98] transition-all duration-300 group shadow-xs"
                >
                  <Star className="w-5 h-5 text-amber-500 dark:text-amber-400 fill-amber-400 shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-extrabold tracking-wider text-xs sm:text-sm uppercase text-slate-800 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                    VIEW VERIFIED GOOGLE REVIEWS
                  </span>
                  <ArrowRight className="w-5 h-5 text-slate-400 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-1.5 transition-all duration-300 ml-0.5" />
                </a>
              </div>
            </div>

            {/* Right: Platform Navigation & Learning Network */}
            <div className="flex flex-col sm:flex-row gap-12 sm:gap-16 lg:gap-24 sm:ml-auto shrink-0 lg:pt-8">
              <div className="space-y-4 min-w-[180px]">
                <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-neutral-100">
                  Platform Tools
                </h5>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-neutral-300">
                  <li>
                    <Link to="/practice" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2.5">
                      <Terminal className="w-4.5 h-4.5 text-[#E04D4D]" />
                      <span>Practice DSA (4,179+)</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/youtube" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2.5">
                      <Play className="w-4.5 h-4.5 text-red-500 dark:text-red-400" />
                      <span>Ad - free Video</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/prephub" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2.5">
                      <BookOpen className="w-4.5 h-4.5 text-amber-500 dark:text-amber-400" />
                      <span>Workspace Roadmaps</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2.5">
                      <Flame className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400" />
                      <span>Student Dashboard</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-4 max-w-[310px]">
                <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-neutral-100">
                  Learning Network
                </h5>
                <div className="space-y-3 text-sm text-slate-600 dark:text-neutral-300">
                  <a
                    href="https://youtube.com/@rkcoachingclasses?si=KfYdwL2LGWjAbTTm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-slate-900 dark:hover:text-white transition-colors group"
                  >
                    <Play className="w-4.5 h-4.5 text-red-500 group-hover:scale-110 transition-transform" />
                    <span>RK Coaching YouTube</span>
                    <ExternalLink className="w-4 h-4 text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300 transition-colors ml-auto" />
                  </a>

                  <a
                    href="https://www.instagram.com/rk.coachings20?igsh=ajl5am10cTlyaGw5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-slate-900 dark:hover:text-white transition-colors group"
                  >
                    <span className="w-4.5 h-4.5 flex items-center justify-center font-bold text-pink-500 dark:text-pink-400 text-xs group-hover:scale-110 transition-transform">
                      IG
                    </span>
                    <span>@rk.coachings20</span>
                    <ExternalLink className="w-4 h-4 text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300 transition-colors ml-auto" />
                  </a>

                  <p className="text-xs text-slate-500 dark:text-neutral-400 pt-1 leading-relaxed">
                    Building deep conceptual foundations from school to advanced algorithmic engineering.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Brand, Copyright & Dedication */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-neutral-500">
            <div className="flex items-center gap-2 text-slate-600 dark:text-neutral-400">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#BA3C3C] to-[#E04D4D] flex items-center justify-center text-white">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-slate-800 dark:text-neutral-200">StudyBuddy</span>
              <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">• Code • Study • Track</span>
            </div>

            <div className="text-center">
              <p className="text-slate-600 dark:text-neutral-300 font-medium">
                © {new Date().getFullYear()} <span className="text-slate-900 dark:text-white font-semibold">Shubham Agrawal</span>. All rights reserved.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5 flex items-center justify-center gap-1.5">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
                <span>for underdogs & ambitious learners</span>
              </p>
            </div>

            <div className="text-xs text-slate-400 dark:text-neutral-500 text-center sm:text-right">
              Designed for Desktop, Laptop & Tablet.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
