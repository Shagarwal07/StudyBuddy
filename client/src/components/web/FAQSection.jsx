import { useState, useMemo } from "react";
import { HelpCircle, ChevronDown, ShieldCheck } from "lucide-react";
import TypewriterText from "./TypewriterText";

export default function FAQSection() {
  const [openFaq, setOpenFaq] = useState(0);

  const FAQS = useMemo(
    () => [
      {
        q: "What is StudyBuddy, what is its use, and who is it built for?",
        category: "Platform Purpose & Safe Harbor",
        paragraphs: [
          "StudyBuddy is strictly a non-commercial educational study suite created solely for personal learning, practice, and academic growth so no legal actions or commercial conflicts arise under fair use.",
          "It is 100% free and built for the underdogs defying the odds—independent learners, students, and engineers striving to crack top tech interviews without paid paywalls or distraction rabbit holes.",
          "While all core problem-solving tools, 3-tier solutions, and roadmaps are completely free for everyone, specialized premium curriculum content, offline mentorship batches, and advanced classroom roadmaps are provided exclusively for enrolled students of RK COACHING CLASSES.",
        ],
      },
      {
        q: "Where does all the problem, video, and editorial data come from?",
        category: "Data Transparency & Origin",
        paragraphs: [
          "All data on StudyBuddy is explicitly either created and served directly by users for personal study or gathered strictly from publicly accessible educational resources across the open internet.",
          "StudyBuddy does not sell, paywall, or claim proprietary ownership over external problem descriptions, titles, or YouTube educational videos.",
        ],
      },
      {
        q: "Official References: When should I use LeetCode, Codeforces, and takeUforward (TUF)?",
        category: "Official Recommendations",
        paragraphs: [
          "For official problem submissions, verified contest ratings, official company tags, and original long-form video tutorials, we strongly recommend and urge every learner to support and use the official platforms: LeetCode (leetcode.com), Codeforces (codeforces.com), and takeUforward (TUF / Striver - takeuforward.org).",
          "StudyBuddy serves as your distraction-free personal study workbench—keeping your 3-tier solutions, 1-click judge forwarder, and ad-free lecture notes organized in one place alongside these official platforms.",
        ],
      },
      {
        q: "What are the core features of the StudyBuddy platform?",
        category: "Platform Features",
        paragraphs: [
          "StudyBuddy brings together everything you need to prepare for top-tier software engineering interviews:",
        ],
        features: [
          {
            icon: "⚡",
            title: "1-Click Judge Forwarder",
            desc: "Forward any problem and starter solution code directly into LeetCode and Codeforces in one click.",
          },
          {
            icon: "🧩",
            title: "3-Tier Algorithmic Solutions",
            desc: "Every problem broken down into Brute Force, Better, and Optimal code with exact Big-O complexities.",
          },
          {
            icon: "📺",
            title: "100% Ad - free Video",
            desc: "Stream YouTube playlists with zero ads, zero shorts, and live time-synced markdown study notes.",
          },
          {
            icon: "🗺️",
            title: "Custom Targeted Roadmaps",
            desc: "Follow Striver 79, Blind 75, NeetCode 150, and SDE sheets structured for step-by-step mastery.",
          },
          {
            icon: "🔥",
            title: "Activity Streak Heatmaps",
            desc: "GitHub-style daily activity matrix and conquest metrics to build unbreakable study consistency.",
          },
        ],
      },
      {
        q: "What is RK COACHING CLASSES and what is its role?",
        category: "Institutional Patronage",
        paragraphs: [
          "RK COACHING CLASSES (Balotra, Rajasthan) is our foundational academic patron and proud family business, built on 10+ years of proven mathematics and science mentorship.",
          "StudyBuddy originated as an internal study workspace for coaching students. Today, while the complete algorithmic suite is 100% free for underdogs and independent learners everywhere, enrolled RK Coaching Classes students receive dedicated classroom roadmaps, offline mentorship, and exclusive academic modules.",
        ],
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

      {/* 8. Comprehensive Platform FAQ & Fair Use Safe Harbor */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-16">
        <div className="relative max-w-4xl mx-auto mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-[#E04D4D] text-xs font-mono font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Platform FAQs & Safe Harbor</span>
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            <TypewriterText text="Frequently Asked Questions" speed={60} delay={150} />
          </h3>
          <p className="text-slate-600 dark:text-neutral-400 text-xs sm:text-sm mt-2 max-w-lg leading-relaxed [text-wrap:balance]">
            Clear facts on educational purpose, public resources, and our academic partnership with RK Coaching Classes.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-4xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "bg-gradient-to-r from-red-50/70 via-rose-50/40 to-red-50/70 dark:from-neutral-900/95 dark:via-red-950/20 dark:to-neutral-900/95 border-red-300/80 dark:border-red-500/50 shadow-md dark:shadow-[0_8px_32px_rgba(224,77,77,0.18)] -translate-y-0.5 animate-[faqCardGlow_4s_ease-in-out_infinite]"
                    : "bg-white/90 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800/80 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-50/80 dark:hover:bg-neutral-900/50 hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
                }`}
              >
                {isOpen && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                )}

                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`shrink-0 text-xs font-mono font-bold transition-colors duration-200 ${
                        isOpen
                          ? "text-red-600 dark:text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                          : "text-red-500 dark:text-[#E04D4D] group-hover:text-red-600 dark:group-hover:text-red-400"
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-bold tracking-tight transition-colors duration-200 ${
                        isOpen
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-800 dark:text-neutral-100 group-hover:text-red-600 dark:group-hover:text-white"
                      }`}
                    >
                      {faq.q}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 bg-red-100 dark:bg-red-500/15 border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                          : "border-slate-200 dark:border-neutral-800 text-slate-400 dark:text-neutral-500 group-hover:text-slate-700 dark:group-hover:text-neutral-300 group-hover:border-slate-300 dark:group-hover:border-neutral-700"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-3.5 border-t border-slate-200/80 dark:border-neutral-800/60 text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed space-y-3">
                    {faq.paragraphs &&
                      faq.paragraphs.map((para, pIdx) => (
                        <p
                          key={pIdx}
                          className="leading-relaxed animate-[textReveal_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
                          style={{ animationDelay: `${pIdx * 80}ms` }}
                        >
                          {para}
                        </p>
                      ))}

                    {faq.features && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
                        {faq.features.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-3 rounded-xl bg-white/95 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800/80 hover:border-red-400/50 hover:bg-slate-50 dark:hover:bg-neutral-900/70 hover:scale-[1.01] flex items-start gap-3 transition-all duration-200 shadow-xs dark:shadow-none animate-[textReveal_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
                            style={{ animationDelay: `${(fIdx + 1) * 75}ms` }}
                          >
                            <span className="text-lg select-none shrink-0">{feat.icon}</span>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white text-xs block">
                                {feat.title}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-neutral-400 leading-tight block mt-0.5">
                                {feat.desc}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Official Reference Notice & Safe Harbor Card */}
        <div className="max-w-4xl mx-auto mt-8 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/70 hover:border-slate-300 dark:hover:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-900/40 hover:-translate-y-0.5 shadow-xs hover:shadow-md dark:shadow-none dark:hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 flex items-center gap-4 text-xs text-slate-600 dark:text-neutral-400 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 group-hover:scale-105 group-hover:border-amber-500/40 transition-all flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-slate-800 dark:text-neutral-200 block text-xs">
              Official Competitive Programming Platforms
            </span>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed block mt-0.5">
              For official problem submissions, contest ratings, and original editorial analysis, please visit and support{" "}
              <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" className="text-amber-500 dark:text-amber-400 hover:underline font-medium">LeetCode</a>,{" "}
              <a href="https://codeforces.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline font-medium">Codeforces</a>,{" "}
              and{" "}
              <a href="https://takeuforward.org" target="_blank" rel="noopener noreferrer" className="text-red-500 dark:text-red-400 hover:underline font-medium">takeUforward (TUF / Striver)</a>.
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
