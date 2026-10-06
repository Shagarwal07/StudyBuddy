import { useEffect, useMemo, useRef, useState } from "react";
import {
  Code2,
  Terminal,
  Play,
  Flame,
  CheckCircle2,
  ArrowRight,
  Zap,
  BookOpen,
  ShieldCheck,
  Compass,
  GraduationCap,
  Heart,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import BackgroundGlow from "../components/common/BackgroundGlow";
import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext";

function TypewriterText({ text = "", speed = 55, delay = 300, className = "", cursor = true, quote = false }) {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const safeText = text || "";
    let index = 0;
    setDisplayed("");
    setIsTyping(true);

    let intervalId = null;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        index++;
        setDisplayed(safeText.slice(0, index));
        if (index >= safeText.length) {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, delay, isVisible]);

  return (
    <span ref={containerRef} className={`relative inline ${className}`} aria-label={text}>
      {!isVisible ? (
        <span className="opacity-0 select-none pointer-events-none" aria-hidden="true">
          {quote ? `“${text}”` : text}
        </span>
      ) : (
        <>
          {quote && "“"}
          {displayed}
          {isTyping && cursor && (
            <span className="inline-block w-[2px] h-[0.9em] bg-[#E04D4D] ml-0.5 align-middle animate-[cursorBlink_0.75s_step-start_infinite]" />
          )}
          {quote && "”"}
        </>
      )}
    </span>
  );
}

function AnimatedCodeBlock({ lines = [], activeTab = "optimal" }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;
    setVisibleCount(0);
    setIsTyping(true);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setVisibleCount(current);
      if (current >= lines.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 85);

    return () => clearInterval(interval);
  }, [activeTab, isInView, lines.length]);

  return (
    <div
      ref={containerRef}
      className="text-neutral-300 space-y-1 font-mono text-[11px] sm:text-xs overflow-x-auto leading-relaxed min-h-[290px]"
    >
      {!isInView ? (
        <div className="opacity-0 select-none pointer-events-none" aria-hidden="true">
          {lines.map((line, idx) => (
            <div key={idx} style={{ paddingLeft: `${line.indent * 0.25}rem` }}>
              {line.content}
            </div>
          ))}
        </div>
      ) : (
        <>
          {lines.slice(0, visibleCount).map((line, idx) => {
            const isCurrentLine = isTyping && idx === visibleCount - 1;
            return (
              <div
                key={idx}
                className="flex items-center animate-[codeWriteReveal_0.38s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ paddingLeft: `${line.indent * 0.25}rem` }}
              >
                <span>{line.content}</span>
                {isCurrentLine && (
                  <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1.5 align-middle animate-[cursorBlink_0.5s_step-start_infinite] shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                )}
              </div>
            );
          })}
          {!isTyping && visibleCount >= lines.length && (
            <div className="flex items-center pl-0 pt-0.5 opacity-60">
              <span className="inline-block w-1.5 h-3.5 bg-neutral-400 ml-1 animate-[cursorBlink_1s_step-start_infinite]" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("optimal");
  const [loaderMounted, setLoaderMounted] = useState(true);
  const [loaderVisible, setLoaderVisible] = useState(true);

  useEffect(() => {
    // Stage 1: Hold overlay briefly, then start smooth 500ms fade out
    const fadeTimer = setTimeout(() => {
      setLoaderVisible(false);
    }, 320);

    // Stage 2: Cleanly unmount overlay after CSS opacity transition completes (320ms + 500ms = 820ms)
    const unmountTimer = setTimeout(() => {
      setLoaderMounted(false);
    }, 850);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  const CODE_SNIPPETS = useMemo(
    () => ({
      optimal: [
        { indent: 0, content: <><span className="text-purple-400">class</span> <span className="text-amber-300">Solution</span> &#123;</> },
        { indent: 4, content: <><span className="text-purple-400">public</span> List&lt;List&lt;Integer&gt;&gt; <span className="text-blue-400">threeSum</span>(<span className="text-purple-400">int</span>[] nums) &#123;</> },
        { indent: 8, content: <span className="text-neutral-500">// 1. Sort to enable two pointers and skip duplicates</span> },
        { indent: 8, content: <>Arrays.<span className="text-blue-400">sort</span>(nums);</> },
        { indent: 8, content: <>List&lt;List&lt;Integer&gt;&gt; res = <span className="text-purple-400">new</span> ArrayList&lt;&gt;();</> },
        { indent: 8, content: <><span className="text-purple-400">for</span> (<span className="text-purple-400">int</span> i = 0; i &lt; nums.length - 2; i++) &#123;</> },
        { indent: 12, content: <><span className="text-purple-400">if</span> (i &gt; 0 &amp;&amp; nums[i] == nums[i - 1]) <span className="text-purple-400">continue</span>;</> },
        { indent: 12, content: <><span className="text-purple-400">int</span> left = i + 1, right = nums.length - 1;</> },
        { indent: 12, content: <span className="text-neutral-500">// Two pointers converge in O(N)</span> },
        { indent: 8, content: <>&#125;</> },
        { indent: 8, content: <><span className="text-purple-400">return</span> res;</> },
        { indent: 4, content: <>&#125;</> },
        { indent: 0, content: <>&#125;</> },
      ],
      better: [
        { indent: 0, content: <><span className="text-purple-400">class</span> <span className="text-amber-300">Solution</span> &#123;</> },
        { indent: 4, content: <><span className="text-purple-400">public</span> List&lt;List&lt;Integer&gt;&gt; <span className="text-blue-400">threeSum</span>(<span className="text-purple-400">int</span>[] nums) &#123;</> },
        { indent: 8, content: <span className="text-neutral-500">// Use HashSet to reduce 3rd loop to O(1) lookup</span> },
        { indent: 8, content: <>Set&lt;List&lt;Integer&gt;&gt; st = <span className="text-purple-400">new</span> HashSet&lt;&gt;();</> },
        { indent: 8, content: <><span className="text-purple-400">for</span> (<span className="text-purple-400">int</span> i = 0; i &lt; nums.length; i++) &#123;</> },
        { indent: 12, content: <>Set&lt;Integer&gt; hashset = <span className="text-purple-400">new</span> HashSet&lt;&gt;();</> },
        { indent: 12, content: <><span className="text-purple-400">for</span> (<span className="text-purple-400">int</span> j = i + 1; j &lt; nums.length; j++) &#123;</> },
        { indent: 16, content: <><span className="text-purple-400">int</span> third = -(nums[i] + nums[j]);</> },
        { indent: 16, content: <><span className="text-purple-400">if</span> (hashset.<span className="text-blue-400">contains</span>(third)) st.<span className="text-blue-400">add</span>(triplet);</> },
        { indent: 16, content: <>hashset.<span className="text-blue-400">add</span>(nums[j]);</> },
        { indent: 12, content: <>&#125;</> },
        { indent: 8, content: <>&#125;</> },
        { indent: 8, content: <><span className="text-purple-400">return</span> <span className="text-purple-400">new</span> ArrayList&lt;&gt;(st);</> },
        { indent: 4, content: <>&#125;</> },
        { indent: 0, content: <>&#125;</> },
      ],
      brute: [
        { indent: 0, content: <><span className="text-purple-400">class</span> <span className="text-amber-300">Solution</span> &#123;</> },
        { indent: 4, content: <><span className="text-purple-400">public</span> List&lt;List&lt;Integer&gt;&gt; <span className="text-blue-400">threeSum</span>(<span className="text-purple-400">int</span>[] nums) &#123;</> },
        { indent: 8, content: <span className="text-neutral-500">// 3 nested loops checking every combination O(N³)</span> },
        { indent: 8, content: <>Set&lt;List&lt;Integer&gt;&gt; st = <span className="text-purple-400">new</span> HashSet&lt;&gt;();</> },
        { indent: 8, content: <><span className="text-purple-400">for</span> (<span className="text-purple-400">int</span> i = 0; i &lt; nums.length; i++) &#123;</> },
        { indent: 12, content: <><span className="text-purple-400">for</span> (<span className="text-purple-400">int</span> j = i + 1; j &lt; nums.length; j++) &#123;</> },
        { indent: 16, content: <><span className="text-purple-400">for</span> (<span className="text-purple-400">int</span> k = j + 1; k &lt; nums.length; k++) &#123;</> },
        { indent: 20, content: <><span className="text-purple-400">if</span> (nums[i] + nums[j] + nums[k] == 0) &#123;</> },
        { indent: 24, content: <>st.<span className="text-blue-400">add</span>(Arrays.<span className="text-blue-400">asList</span>(nums[i], nums[j], nums[k]));</> },
        { indent: 20, content: <>&#125;</> },
        { indent: 16, content: <>&#125;</> },
        { indent: 12, content: <>&#125;</> },
        { indent: 8, content: <>&#125;</> },
        { indent: 8, content: <><span className="text-purple-400">return</span> <span className="text-purple-400">new</span> ArrayList&lt;&gt;(st);</> },
        { indent: 4, content: <>&#125;</> },
        { indent: 0, content: <>&#125;</> },
      ],
    }),
    []
  );

  const [battleState, setBattleState] = useState({
    p1Hp: 100,
    p2Hp: 100,
    p1Recoil: false,
    p2Recoil: false,
    critText: "VS",
  });

  const fireP1 = () => {
    setBattleState((prev) => ({
      ...prev,
      p2Hp: prev.p2Hp <= 15 ? 100 : prev.p2Hp - 15,
      p1Recoil: true,
      critText: prev.p2Hp <= 15 ? "💥 KO! RESET" : "-15 HP!",
    }));
    setTimeout(() => {
      setBattleState((prev) => ({ ...prev, p1Recoil: false, critText: "VS" }));
    }, 700);
  };

  const fireP2 = () => {
    setBattleState((prev) => ({
      ...prev,
      p1Hp: prev.p1Hp <= 15 ? 100 : prev.p1Hp - 15,
      p2Recoil: true,
      critText: prev.p1Hp <= 15 ? "💥 KO! RESET" : "CRIT -15!",
    }));
    setTimeout(() => {
      setBattleState((prev) => ({ ...prev, p2Recoil: false, critText: "VS" }));
    }, 700);
  };

  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

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
        numColor: "text-emerald-400",
        iconStyle: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
        activeRow: "border-emerald-500/50 bg-gradient-to-r from-emerald-950/50 via-neutral-900/95 to-neutral-900/80 shadow-[0_4px_30px_rgba(16,185,129,0.2)]",
        defaultRow: "border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 via-neutral-950/70 to-neutral-950/50 hover:border-emerald-500/45 hover:bg-neutral-900/80",
        activeArrow: "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400/50 text-white shadow-[0_0_18px_rgba(16,185,129,0.5)]",
        defaultArrow: "bg-neutral-900 border-neutral-800 text-neutral-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
        billuGlow: "from-emerald-500/20 via-teal-500/20 to-emerald-500/10",
        bubbleBorder: "border-emerald-500/40 shadow-[0_10px_30px_rgba(16,185,129,0.2)]",
      },
      {
        id: "roadmaps",
        num: "02",
        title: "Custom Targeted Roadmaps",
        desc: "Personalized study paths, Striver 79, Blind 75, and NeetCode 150 at your pace.",
        billuTip: "Pick your dream company roadmap, and I'll keep your algorithmic milestones locked in!",
        path: "/prephub",
        icon: Compass,
        badgeText: "Curated Roadmaps",
        color: "amber",
        numColor: "text-amber-400",
        iconStyle: "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
        activeRow: "border-amber-500/50 bg-gradient-to-r from-amber-950/50 via-neutral-900/95 to-neutral-900/80 shadow-[0_4px_30px_rgba(245,158,11,0.2)]",
        defaultRow: "border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-neutral-950/70 to-neutral-950/50 hover:border-amber-500/45 hover:bg-neutral-900/80",
        activeArrow: "bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400/50 text-white shadow-[0_0_18px_rgba(245,158,11,0.5)]",
        defaultArrow: "bg-neutral-900 border-neutral-800 text-neutral-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-400 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        billuGlow: "from-amber-500/20 via-orange-500/20 to-amber-500/10",
        bubbleBorder: "border-amber-500/40 shadow-[0_10px_30px_rgba(245,158,11,0.2)]",
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
        numColor: "text-rose-400",
        iconStyle: "bg-red-500/15 border-red-500/30 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]",
        activeRow: "border-red-500/50 bg-gradient-to-r from-red-950/50 via-neutral-900/95 to-neutral-900/80 shadow-[0_4px_30px_rgba(239,68,68,0.2)]",
        defaultRow: "border-red-500/20 bg-gradient-to-r from-red-950/20 via-neutral-950/70 to-neutral-950/50 hover:border-red-500/45 hover:bg-neutral-900/80",
        activeArrow: "bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] border-red-400/50 text-white shadow-[0_0_18px_rgba(224,77,77,0.5)]",
        defaultArrow: "bg-neutral-900 border-neutral-800 text-neutral-400 group-hover:bg-[#E04D4D] group-hover:text-white group-hover:border-red-400 group-hover:shadow-[0_0_15px_rgba(224,77,77,0.4)]",
        billuGlow: "from-red-500/20 via-rose-500/20 to-red-500/10",
        bubbleBorder: "border-red-500/40 shadow-[0_10px_30px_rgba(224,77,77,0.2)]",
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
        numColor: "text-purple-400",
        iconStyle: "bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
        activeRow: "border-purple-500/50 bg-gradient-to-r from-purple-950/50 via-neutral-900/95 to-neutral-900/80 shadow-[0_4px_30px_rgba(168,85,247,0.2)]",
        defaultRow: "border-purple-500/20 bg-gradient-to-r from-purple-950/20 via-neutral-950/70 to-neutral-950/50 hover:border-purple-500/45 hover:bg-neutral-900/80",
        activeArrow: "bg-gradient-to-r from-purple-600 to-indigo-500 border-purple-400/50 text-white shadow-[0_0_18px_rgba(168,85,247,0.5)]",
        defaultArrow: "bg-neutral-900 border-neutral-800 text-neutral-400 group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-400 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]",
        billuGlow: "from-purple-500/20 via-indigo-500/20 to-purple-500/10",
        bubbleBorder: "border-purple-500/40 shadow-[0_10px_30px_rgba(168,85,247,0.2)]",
      },
    ],
    []
  );


  const FAQS = useMemo(
    () => [
      {
        q: "What is StudyBuddy, what is its use, and who is it built for?",
        category: "Platform Purpose & Safe Harbor",
        badge: "Built For Underdogs 🥊",
        paragraphs: [
          "StudyBuddy is strictly a non-commercial educational study suite created solely for personal learning, practice, and academic growth so no legal actions or commercial conflicts arise under fair use.",
          "It is 100% free and built for the underdogs defying the odds—independent learners, students, and engineers striving to crack top tech interviews without paid paywalls or distraction rabbit holes.",
          "While all core problem-solving tools, 3-tier solutions, and roadmaps are completely free for everyone, specialized premium curriculum content, offline mentorship batches, and advanced classroom roadmaps are provided exclusively for enrolled students of RK COACHING CLASSES.",
        ],
      },
      {
        q: "Where does all the problem, video, and editorial data come from?",
        category: "Data Transparency & Origin",
        badge: "Public Resources & Fair Use",
        paragraphs: [
          "All data on StudyBuddy is explicitly either created and served directly by users for personal study or gathered strictly from publicly accessible educational resources across the open internet.",
          "StudyBuddy does not sell, paywall, or claim proprietary ownership over external problem descriptions, titles, or YouTube educational videos.",
        ],
      },
      {
        q: "Official References: When should I use LeetCode, Codeforces, and takeUforward (TUF)?",
        category: "Official Recommendations",
        badge: "Official Platforms Recommended",
        paragraphs: [
          "For official problem submissions, verified contest ratings, official company tags, and original long-form video tutorials, we strongly recommend and urge every learner to support and use the official platforms: LeetCode (leetcode.com), Codeforces (codeforces.com), and takeUforward (TUF / Striver - takeuforward.org).",
          "StudyBuddy serves as your distraction-free personal study workbench—keeping your 3-tier solutions, 1-click judge forwarder, and ad-free lecture notes organized in one place alongside these official platforms.",
        ],
      },
      {
        q: "What are the core features of the StudyBuddy platform?",
        category: "Platform Features",
        badge: "5 All-In-One Pillars",
        paragraphs: [
          "StudyBuddy brings together everything you need to prepare for top-tier software engineering interviews:",
        ],
        features: [
          {
            icon: "⚡",
            title: "100% LeetCode Solved Sync",
            desc: "Browser extension syncs accepted LeetCode solutions directly into your activity heatmaps and roadmaps.",
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
        badge: "Academic Patron • Balotra, RJ",
        paragraphs: [
          "RK COACHING CLASSES (Balotra, Rajasthan) is our foundational academic patron and proud family business, built on 10+ years of proven mathematics and science mentorship.",
          "StudyBuddy originated as an internal study workspace for coaching students. Today, while the complete algorithmic suite is 100% free for underdogs and independent learners everywhere, enrolled RK Coaching Classes students receive dedicated classroom roadmaps, offline mentorship, and exclusive academic modules.",
        ],
      },
    ],
    []
  );

  const billuFaqTips = useMemo(
    () => [
      "100% free for underdogs! RK Coaching students get dedicated classroom tracks.",
      "Zero paywalls or monetization! All data is strictly public or user-served.",
      "For official contests & submissions, always check LeetCode & Codeforces!",
      "15,600+ problems, 3-tier solutions, and Ad - free Video all in one place!",
      "Rooted in Balotra, Rajasthan — 10+ years of family-run mentorship!",
    ],
    []
  );

  const SHEETS = useMemo(
    () => [
      {
        name: "Blind 75",
        count: "75 Problems",
        desc: "The classic high-yield roadmap covering all essential patterns.",
        difficulty: "Core Patterns",
        tag: "Essential",
        color: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
      },
      {
        name: "Striver's SDE Sheet",
        count: "180 Problems",
        desc: "Comprehensive interview curriculum from arrays to dynamic programming.",
        difficulty: "Comprehensive",
        tag: "Interview",
        color: "from-red-500/20 to-rose-500/10 border-red-500/30 text-rose-400",
      },
      {
        name: "Codeforces Ladder",
        count: "269 Problems",
        desc: "Contest rating ladders (800-1600+) with accepted C++ solutions & 1-click judge forwarding.",
        difficulty: "Rating 800–1600+",
        tag: "Contests",
        color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400",
        to: "/prephub?subject=codeforces-ladder",
      },
      {
        name: "SQL 75",
        count: "75 Problems",
        desc: "Crucial SQL queries, window functions, and schema problem solving.",
        difficulty: "Queries & Schema",
        tag: "Database",
        color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-cyan-400",
      },
    ],
    [],
  );

  return (
    <div className="relative min-h-screen bg-[#030005] text-white overflow-x-hidden font-sans antialiased selection:bg-red-500/30 selection:text-white">
      {/* SMOOTH UI PAGE TRANSITION DISSOLVE OVERLAY */}
      {loaderMounted && (
        <div
          className={`fixed inset-0 z-[100] transition-opacity duration-500 ease-out pointer-events-none ${
            loaderVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Loader
            text="Loading StudyBuddy..."
            subtitle="Preparing your learning workspace."
            fullscreen
          />
        </div>
      )}

      <BackgroundGlow />

      {/* 1. Glassmorphism Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-neutral-800/80 bg-[#030005]/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group py-0.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#BA3C3C] to-[#E04D4D] flex items-center justify-center text-white shadow-[0_0_20px_rgba(224,77,77,0.35)] group-hover:scale-105 transition-transform duration-200">
              <Code2 className="w-4.5 h-4.5" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-neutral-100">
                  StudyBuddy
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-[#E04D4D] border border-red-500/25">
                  2.0
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-medium tracking-wide">
                Code • Study • Track
              </span>
            </div>
          </Link>

          {/* Apple Notch / Dynamic Island Navigation Capsule */}
          <nav className="hidden md:flex items-center p-1 rounded-full bg-neutral-950/85 border border-neutral-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            <Link
              to="/practice"
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-full transition-all flex items-center gap-2 group"
            >
              <Terminal className="w-3.5 h-3.5 text-[#E04D4D] group-hover:scale-110 transition-transform" />
              <span>Practice DSA</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800 group-hover:border-neutral-700">
                15,600+
              </span>
            </Link>

            <span className="w-[1px] h-3.5 bg-neutral-800/90 my-auto"></span>

            <Link
              to="/youtube"
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-full transition-all flex items-center gap-2 group"
            >
              <Play className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
              <span>Ad - free Video</span>
            </Link>

            <span className="w-[1px] h-3.5 bg-neutral-800/90 my-auto"></span>

            <Link
              to="/prephub"
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800/80 rounded-full transition-all flex items-center gap-2 group"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Workspace</span>
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-[0_2px_15px_rgba(224,77,77,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-[0_2px_15px_rgba(224,77,77,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="h-16 w-full shrink-0" aria-hidden="true" />

      {/* 2. Hero Section (Above the Fold) */}
      <section className="relative z-10 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        {/* Glow Tag — Underdogs Identity */}
        <div className="inline-flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium tracking-wide text-neutral-300 mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] animate-[fadeInUp_0.6s_ease-out_both]">
          <span className="text-base select-none">🥊</span>
          <span>100% Free • Built for the</span>
          <span className="font-bold bg-gradient-to-r from-[#F26464] via-[#E04D4D] to-orange-400 bg-clip-text text-transparent">
            underdogs defying the odds
          </span>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-amber-300/90 font-mono hidden sm:inline">Premium Modules for RK Coaching Students</span>
        </div>

        {/* Hero Title — Centered Structure */}
        <h1 className="text-3xl sm:text-4xl md:text-[44px] lg:text-[48px] font-extrabold tracking-tight max-w-5xl leading-[1.18] text-white mb-6 animate-[fadeInUp_0.7s_ease-out_both] [animation-delay:100ms]">
          <span className="block sm:whitespace-nowrap">Master Algorithms. Conquer Courses.</span>
          <span className="block mt-1 sm:whitespace-nowrap">
            <span className="text-neutral-100">Stream YouTube. </span>
            <span className="bg-gradient-to-r from-[#F26464] via-[#E04D4D] to-[#BA3C3C] bg-clip-text text-transparent">
              <TypewriterText text="Zero Distractions." speed={75} delay={600} />
            </span>
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed mb-8 animate-[fadeInUp_0.7s_ease-out_both] [animation-delay:180ms]">
          <span className="text-[#E04D4D] font-semibold">15,600+ coding challenges</span> across LeetCode & Codeforces. 4,179+ curated 3-tier solutions (Brute, Better, Optimal), 1-click judge forwarder, ad-free YouTube playlist tracker, and daily coding heatmaps.
        </p>

        {/* Platform Metrics Dock (Sleek Horizontal Capsule) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-3xl mx-auto p-2 sm:p-2.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/90 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6)] mb-8 animate-[fadeInUp_0.7s_ease-out_both] [animation-delay:260ms]">
          <div className="flex flex-col items-center py-2.5 px-3 border-r border-neutral-800/60 hover:bg-neutral-900/60 rounded-xl transition-all duration-200 cursor-default">
            <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight">15,600+</span>
            <span className="text-[11px] text-neutral-400 font-medium">Practice Catalog</span>
          </div>
          <div className="flex flex-col items-center py-2.5 px-3 border-r border-neutral-800/60 hover:bg-neutral-900/60 rounded-xl transition-all duration-200 cursor-default">
            <span className="text-lg sm:text-xl font-extrabold text-[#E04D4D] tracking-tight">4,179+</span>
            <span className="text-[11px] text-neutral-400 font-medium">3-Tier Solutions</span>
          </div>
          <div className="flex flex-col items-center py-2.5 px-3 border-r border-neutral-800/60 hover:bg-neutral-900/60 rounded-xl transition-all duration-200 cursor-default">
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400 tracking-tight">100%</span>
            <span className="text-[11px] text-neutral-400 font-medium">Ad - free Video</span>
          </div>
          <div className="flex flex-col items-center py-2.5 px-3 hover:bg-neutral-900/60 rounded-xl transition-all duration-200 cursor-default text-center">
            <span className="text-lg sm:text-xl font-extrabold text-amber-400 tracking-tight">1-Click</span>
            <span className="text-[11px] text-neutral-400 font-medium">Judge Forwarder</span>
          </div>
        </div>

        {/* CTA Button Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto animate-[fadeInUp_0.7s_ease-out_both] [animation-delay:340ms]">
          <Link
            to={isAuthenticated ? "/practice" : "/signup"}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] border border-red-400/20 px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-[0_4px_25px_rgba(224,77,77,0.35)] hover:shadow-[0_4px_35px_rgba(224,77,77,0.5)] hover:brightness-110 active:scale-[0.98] transition-all duration-300"
          >
            <Code2 className="w-4 h-4" />
            <span>Start Practicing Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <Link
            to="/youtube"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-neutral-700 px-7 py-3.5 rounded-xl font-semibold text-xs sm:text-sm text-neutral-200 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 text-red-400" />
            <span>Explore Ad - free Video</span>
          </Link>
        </div>
      </section>

      {/* Arcade Section Break — 3D Robot Bug Battle */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 select-none">

        {/* Main Arena Battleground */}
        <div className="relative rounded-2xl border border-neutral-800/80 bg-[#0c0914]/80 backdrop-blur-xl p-4 sm:p-6 shadow-[0_15px_50px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Subtle Cyber Grid Background Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1a2e10_1px,transparent_1px),linear-gradient(to_bottom,#1f1a2e10_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          <div className="relative flex items-center justify-between gap-2 sm:gap-4">
            {/* Player 1: 3D Red Robot Bug */}
            <div
              onClick={fireP1}
              className={`group flex items-center gap-3 cursor-pointer select-none transition-transform duration-200 ${
                battleState.p1Recoil ? "animate-[recoilLeft_0.4s_ease-out]" : "animate-[bugBobLeft_2.5s_ease-in-out_infinite]"
              }`}
              title="Click to fire Syntax Buster!"
            >
              <div className="relative flex items-center justify-center">
                {/* Aura Glow */}
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl group-hover:bg-red-500/35 transition-all" />
                {/* 3D Robot Image */}
                <img
                  src="/assets/red-bug-3d.png"
                  alt="3D Syntax Bot"
                  className="relative w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-[0_10px_20px_rgba(239,68,68,0.5)] group-hover:scale-105 active:scale-95 transition-transform"
                />
                {/* Muzzle Flash Blast on Right */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-white blur-[2px] animate-[muzzleFlash_0.7s_ease-in-out_infinite] pointer-events-none" />
              </div>

              {/* Bot 1 HUD */}
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-extrabold tracking-wider text-red-400">P1: SYNTAX_BOT</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-red-500/20 text-red-300 border border-red-500/30">Lv.99</span>
                </div>
                {/* Health Bar */}
                <div className="w-24 h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden mt-1 relative">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-amber-400 transition-all duration-300 shadow-[0_0_8px_#ef4444]"
                    style={{ width: `${battleState.p1Hp}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-neutral-400 mt-0.5">HP {battleState.p1Hp}/100</span>
              </div>
            </div>

            {/* Central Laser Firing Rail & Clash Nexus */}
            <div className="relative flex-1 mx-2 sm:mx-6 h-12 flex items-center">
              {/* Outer Rail Line */}
              <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-red-500/80 via-neutral-800 to-cyan-500/80 relative shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                {/* Laser Bullets Left -> Right (Red/Amber Salvo) */}
                <div
                  className="absolute top-1/2 w-6 sm:w-8 h-2 rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-white shadow-[0_0_14px_#ef4444,0_0_24px_#f97316] pointer-events-none"
                  style={{ animation: "fireBulletRight 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 0s" }}
                />
                <div
                  className="absolute top-1/2 w-5 sm:w-6 h-1.5 rounded-full bg-gradient-to-r from-red-500 to-amber-200 shadow-[0_0_10px_#ef4444] pointer-events-none"
                  style={{ animation: "fireBulletRight 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.5s" }}
                />
                <div
                  className="absolute top-1/2 w-4 sm:w-5 h-1.5 rounded-full bg-red-400 shadow-[0_0_8px_#ef4444] pointer-events-none"
                  style={{ animation: "fireBulletRight 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.0s" }}
                />

                {/* Laser Bullets Right -> Left (Cyan/Blue Salvo) */}
                <div
                  className="absolute top-1/2 w-6 sm:w-8 h-2 rounded-full bg-gradient-to-l from-blue-600 via-cyan-400 to-white shadow-[0_0_14px_#22d3ee,0_0_24px_#06b6d4] pointer-events-none"
                  style={{ animation: "fireBulletLeft 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.25s" }}
                />
                <div
                  className="absolute top-1/2 w-5 sm:w-6 h-1.5 rounded-full bg-gradient-to-l from-cyan-500 to-blue-200 shadow-[0_0_10px_#22d3ee] pointer-events-none"
                  style={{ animation: "fireBulletLeft 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.75s" }}
                />
                <div
                  className="absolute top-1/2 w-4 sm:w-5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] pointer-events-none"
                  style={{ animation: "fireBulletLeft 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.25s" }}
                />

                {/* Central Clash Nexus & Shockwave */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  {/* Expanding Shockwave Ping */}
                  <span className="absolute w-8 h-8 rounded-full border border-amber-400/80 animate-ping pointer-events-none" />
                  {/* Arcade Center Badge */}
                  <div className="relative px-2.5 py-1 rounded-lg bg-neutral-950/95 border border-amber-500/50 flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="tracking-wider">{battleState.critText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Player 2: 3D Cyan Robot Bug */}
            <div
              onClick={fireP2}
              className={`group flex items-center gap-3 cursor-pointer select-none transition-transform duration-200 ${
                battleState.p2Recoil ? "animate-[recoilRight_0.4s_ease-out]" : "animate-[bugBobRight_2.7s_ease-in-out_infinite]"
              }`}
              title="Click to fire Runtime Shield!"
            >
              {/* Bot 2 HUD */}
              <div className="hidden sm:flex flex-col text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Lv.99</span>
                  <span className="text-[11px] font-mono font-extrabold tracking-wider text-cyan-400">P2: RUNTIME_BOT</span>
                </div>
                {/* Health Bar */}
                <div className="w-24 h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden mt-1 relative ml-auto">
                  <div
                    className="h-full bg-gradient-to-l from-cyan-500 to-blue-400 transition-all duration-300 shadow-[0_0_8px_#22d3ee]"
                    style={{ width: `${battleState.p2Hp}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-neutral-400 mt-0.5">HP {battleState.p2Hp}/100</span>
              </div>

              <div className="relative flex items-center justify-center">
                {/* Aura Glow */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl group-hover:bg-cyan-500/35 transition-all" />
                {/* 3D Robot Image */}
                <img
                  src="/assets/cyan-bug-3d.png"
                  alt="3D Runtime Bot"
                  className="relative w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-[0_10px_20px_rgba(34,211,238,0.5)] group-hover:scale-105 active:scale-95 transition-transform"
                />
                {/* Muzzle Flash Blast on Left */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-l from-cyan-400 via-blue-300 to-white blur-[2px] animate-[muzzleFlash_0.7s_ease-in-out_infinite] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 4. Interactive Split-IDE Live Product Showcase Mockup */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-4 pb-20 text-center flex flex-col items-center">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs uppercase tracking-widest text-[#E04D4D] font-bold">
            Interactive Product Preview
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1.5">
            <TypewriterText text="Test The 3-Tier Algorithmic Studio" speed={55} delay={150} />
          </h3>
          <p className="text-neutral-400 text-xs sm:text-sm mt-2">
            Switch between Brute, Better, and Optimal tabs to see real-time complexity evolution and code.
          </p>
        </div>

        <div className="relative group w-full max-w-5xl rounded-2xl border border-neutral-800 bg-[#0c0a12]/95 shadow-[0_20px_70px_rgba(0,0,0,0.8)] hover:border-neutral-700/80 transition-all duration-300 overflow-hidden text-left">
          {/* Subtle Ambient Backlight Glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-600/10 via-amber-500/5 to-cyan-600/10 blur-xl opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity duration-500" />
          {/* Mockup Window Header */}
          <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-950/80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              <span className="text-xs text-neutral-400 font-mono ml-2">StudyBuddy Workspace — Problem #15: 3Sum</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                Medium
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                3-Tier Solutions
              </span>
            </div>
          </div>

          {/* Mockup Workspace Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
            {/* Left Column: Algorithmic Approach Explorer */}
            <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-neutral-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Algorithmic Approaches
                  </span>
                  <span className="text-[11px] text-[#E04D4D] font-mono">3 / 3 Generated</span>
                </div>

                <div className="flex gap-1.5 p-1 bg-neutral-900 rounded-xl mb-4 border border-neutral-800">
                  <button
                    onClick={() => setActiveTab("brute")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "brute"
                        ? "bg-neutral-800 text-white shadow-sm"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Brute O(N³)
                  </button>
                  <button
                    onClick={() => setActiveTab("better")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "better"
                        ? "bg-neutral-800 text-white shadow-sm"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Better O(N²)
                  </button>
                  <button
                    onClick={() => setActiveTab("optimal")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === "optimal"
                        ? "bg-[#BA3C3C] text-white shadow-sm"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Optimal O(N²)
                  </button>
                </div>

                {activeTab === "optimal" && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/60">
                      <div className="text-xs font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        Two Pointers with Initial Sorting
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Sort array once in <code className="text-neutral-300 font-mono">O(N log N)</code>. Fix the first element with loop <code className="text-neutral-300 font-mono">i</code>, then converge two pointers (<code className="text-red-400 font-mono">left</code>, <code className="text-red-400 font-mono">right</code>) in linear time. Skips duplicates in-place without extra sets.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Time Complexity</span>
                        <span className="font-mono text-emerald-400 font-bold text-sm">O(N²)</span>
                        <span className="text-[10px] text-neutral-500 block">Dominated by 2-pointers</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Auxiliary Space</span>
                        <span className="font-mono text-cyan-400 font-bold text-sm">O(1)</span>
                        <span className="text-[10px] text-neutral-500 block">No hash sets needed</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "better" && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/60">
                      <div className="text-xs font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        Hash Set Lookup for 3rd Element
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Fix <code className="text-neutral-300 font-mono">nums[i]</code> and <code className="text-neutral-300 font-mono">nums[j]</code> with two loops. Check if <code className="text-red-400 font-mono">-(nums[i] + nums[j])</code> exists in a hash set of inner loop elements. Uses a set to filter duplicate combinations.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Time Complexity</span>
                        <span className="font-mono text-amber-400 font-bold text-sm">O(N²)</span>
                        <span className="text-[10px] text-neutral-500 block">Amortized hash lookups</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Auxiliary Space</span>
                        <span className="font-mono text-amber-400 font-bold text-sm">O(N + K)</span>
                        <span className="text-[10px] text-neutral-500 block">Hash set + duplicate set</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "brute" && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/60">
                      <div className="text-xs font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        Three Nested Iterative Loops
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Iterate through all possible index triplets <code className="text-neutral-300 font-mono">(i, j, k)</code> with 3 nested loops. Whenever the sum is zero, sort the triplet and insert into a set to eliminate duplicate combinations.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Time Complexity</span>
                        <span className="font-mono text-red-400 font-bold text-sm">O(N³)</span>
                        <span className="text-[10px] text-neutral-500 block">Triple loop traversal</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/60">
                        <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Auxiliary Space</span>
                        <span className="font-mono text-red-400 font-bold text-sm">O(2 × K)</span>
                        <span className="text-[10px] text-neutral-500 block">Unique triplet set storage</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Side Floating Tag: Video Study Sync */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-neutral-300 font-medium">Striver's SDE Playlist</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">Progress: 84%</span>
              </div>
            </div>

            {/* Right Column: In-Browser Code & Testcase Runner Mock */}
            <div className="lg:col-span-7 bg-[#05040a] p-5 flex flex-col justify-between font-mono text-xs">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-neutral-900 text-neutral-200 border border-neutral-800 font-medium text-[11px]">
                      Solution.java
                    </span>
                    <span className="text-neutral-500 text-[11px]">Java 21 • GCC 14 C++</span>
                  </div>
                  {activeTab === "optimal" && (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] animate-[fadeInUp_0.3s_ease-out]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Optimal Solution • O(N²)
                    </span>
                  )}
                  {activeTab === "better" && (
                    <span className="text-amber-400 flex items-center gap-1 text-[11px] animate-[fadeInUp_0.3s_ease-out]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Better Solution • O(N²)
                    </span>
                  )}
                  {activeTab === "brute" && (
                    <span className="text-red-400 flex items-center gap-1 text-[11px] animate-[fadeInUp_0.3s_ease-out]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Brute Force • O(N³)
                    </span>
                  )}
                </div>

                <AnimatedCodeBlock
                  lines={CODE_SNIPPETS[activeTab] || CODE_SNIPPETS.optimal}
                  activeTab={activeTab}
                />
              </div>

              {/* Console Output Bar */}
              <div className="mt-4 p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      activeTab === "optimal"
                        ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                        : activeTab === "better"
                        ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                        : "bg-red-400 shadow-[0_0_8px_#f87171]"
                    }`}
                  />
                  <span
                    className={`font-semibold text-[11px] ${
                      activeTab === "optimal"
                        ? "text-emerald-400"
                        : activeTab === "better"
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    Output: [ [-1, -1, 2], [-1, 0, 1] ]
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Runtime:{" "}
                  <span className="text-white font-bold">
                    {activeTab === "optimal"
                      ? "24 ms"
                      : activeTab === "better"
                      ? "188 ms"
                      : "1,420 ms"}
                  </span>{" "}
                  • Tests:{" "}
                  <span
                    className={
                      activeTab === "optimal"
                        ? "text-emerald-400 font-semibold"
                        : activeTab === "better"
                        ? "text-emerald-400 font-semibold"
                        : "text-amber-400 font-semibold"
                    }
                  >
                    {activeTab === "brute"
                      ? "312/312 Passed (TLE warning)"
                      : "312/312 Passed"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 50% Centered Red Accent Line Divider */}
      <div className="relative z-10 w-full flex justify-center py-4">
        <div className="w-1/2 max-w-2xl h-[2px] bg-gradient-to-r from-transparent via-[#E04D4D] to-transparent rounded-full shadow-[0_0_12px_rgba(224,77,77,0.45)] animate-[dividerGlow_3.5s_ease-in-out_infinite]" />
      </div>

      {/* 5. The 3 Pillars of StudyBuddy */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-10 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs uppercase tracking-widest text-[#E04D4D] font-bold mb-2">
            Built by the serious • For the serious • To be the serious
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            <TypewriterText text="Code, Study, and Track in Harmony." speed={55} delay={150} />
          </h3>
          <p className="text-neutral-400 text-sm sm:text-base mt-3">
            Stop switching between YouTube tabs, scattered LeetCode bookmarks, and disorganized notes.
          </p>
        </div>

        {/* 2-Column Split: Creative Billu on Left, Headings with Arrows on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Creative Billu Mascot Presentation */}
          <div className="lg:col-span-5 flex flex-col items-center text-center relative">
            {/* Billu Speech Bubble */}
            <div className={`relative mb-3 px-5 py-3.5 rounded-2xl bg-neutral-900/95 border backdrop-blur-md max-w-sm transition-all duration-300 ${CORE_FEATURES[activeFeature].bubbleBorder}`}>
              <p className="text-xs text-neutral-200 font-medium leading-relaxed transition-all duration-300">
                "{CORE_FEATURES[activeFeature].billuTip}"
              </p>
              {/* Bubble Arrow Tail */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-neutral-900 border-r border-b border-inherit rotate-45" />
            </div>

            {/* Billu 3D Character Stand */}
            <div className="relative w-56 h-64 sm:w-64 sm:h-72 flex items-center justify-center">
              {/* Warm Dynamic Backlight Glow Aura */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${CORE_FEATURES[activeFeature].billuGlow} blur-2xl pointer-events-none transition-all duration-500`} />

              {/* 3D Billu Mascot Image */}
              <img
                src="/assets/billu-mascot-3d.png"
                alt="Billu the Fox Mascot"
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] animate-[floatSlow_4s_ease-in-out_infinite]"
              />

              {/* Realistic Ground Pedestal & Ambient Contact Shadows */}
              <div className="absolute bottom-2.5 w-40 h-3 rounded-[100%] bg-black/95 blur-[2px] pointer-events-none" />
              <div className="absolute bottom-1 w-52 h-6 rounded-[100%] bg-black/70 blur-md pointer-events-none" />
              <div className={`absolute -bottom-0.5 w-48 h-6 rounded-[100%] bg-gradient-to-r ${CORE_FEATURES[activeFeature].billuGlow} blur-lg opacity-50 pointer-events-none transition-all duration-500`} />
            </div>


            {/* Mascot Identification Badge */}
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-0.5 rounded-full bg-neutral-950/80 border border-neutral-800 text-[10px] font-mono text-neutral-400">
              <span className="text-sm">🦊</span>
              <span className="font-semibold text-neutral-200">Billu</span>
              <span className="text-neutral-600">•</span>
              <span className="text-[#E04D4D] font-bold">Chief Mentor</span>
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
                    {/* Number & Icon Pill */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border flex items-center justify-center transition-all duration-300 ${feat.iconStyle}`}
                    >
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>

                    {/* Heading & Micro Detail */}
                    <div className="flex flex-col text-left truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-mono font-bold ${feat.numColor}`}>
                          {feat.num}
                        </span>
                        <h4
                          className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                            isActive ? "text-white" : "text-neutral-100 group-hover:text-white"
                          }`}
                        >
                          {feat.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {feat.desc}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Action Button */}
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

      {/* 6. Curated Interview Sheets Showcase */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-[#E04D4D] font-bold mb-2">Curated Roadmaps</h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              <TypewriterText text="The Best Coding Sheets In One Place" speed={55} delay={150} />
            </h3>
          </div>
          <Link
            to="/prephub"
            className="mt-4 md:mt-0 text-sm font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            Explore all sheets in Workspace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SHEETS.map((sheet) => (
            <Link
              key={sheet.name}
              to={sheet.to || "/practice"}
              className="p-5 sm:p-5.5 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)] transition-all duration-300 group flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-gradient-to-r whitespace-nowrap shrink-0 ${sheet.color}`}>
                    {sheet.tag}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 whitespace-nowrap bg-neutral-950/70 border border-neutral-800/80 px-2 py-0.5 rounded-md shrink-0">
                    {sheet.count}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-[#E04D4D] transition-colors mb-2">
                  {sheet.name}
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                  {sheet.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400 group-hover:text-white transition-colors">
                <span className="font-medium text-[11px] text-neutral-400">{sheet.difficulty}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 50% Centered Red Accent Line Divider */}
      <div className="relative z-10 w-full flex justify-center py-4">
        <div className="w-1/2 max-w-2xl h-[2px] bg-gradient-to-r from-transparent via-[#E04D4D] to-transparent rounded-full shadow-[0_0_12px_rgba(224,77,77,0.45)] animate-[dividerGlow_3.5s_ease-in-out_infinite]" />
      </div>

      {/* 7. Comprehensive Platform FAQ & Fair Use Safe Harbor */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-16">
        {/* FAQ Header with Guessing Billu */}
        <div className="relative max-w-4xl mx-auto mb-12 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Heading Text */}
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-[#E04D4D] text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Platform FAQs & Safe Harbor</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              <TypewriterText text="Frequently Asked Questions" speed={60} delay={150} />
            </h3>
            <p className="text-neutral-400 text-xs sm:text-sm mt-2 max-w-lg leading-relaxed [text-wrap:balance]">
              Clear facts on educational purpose, public resources, and our academic partnership with RK Coaching Classes.
            </p>
          </div>

          {/* 3D Billu in Guessing Pose beside Heading (Direct on Canvas, No Placeholder Box) */}
          <div className="relative shrink-0 flex items-center gap-3 sm:gap-4">
            {/* Billu Figure */}
            <div className="relative w-24 h-32 sm:w-28 sm:h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl pointer-events-none" />
              <img
                src="/assets/billu-guessing-3d.png"
                alt="Billu Fox Mascot Guessing Pose"
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] animate-[floatSlow_4s_ease-in-out_infinite]"
              />
              <div className="absolute bottom-1 w-20 h-2 rounded-[100%] bg-black/95 blur-[2px] pointer-events-none" />
              <div className="absolute bottom-0 w-24 h-4 rounded-[100%] bg-black/70 blur-md pointer-events-none" />
            </div>

            {/* Speech Bubble / Wondering Note */}
            <div className="flex flex-col text-left max-w-[180px] sm:max-w-[220px]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold mb-1.5 w-fit">
                <span>🦊</span>
                <span>Billu is Wondering</span>
              </div>
              <p className="text-xs text-neutral-300 leading-snug font-medium">
                "{openFaq !== null
                  ? billuFaqTips[openFaq]
                  : "Got questions? Click any question below to see how StudyBuddy works!"}"
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Accordion List (Centered & Full Width) */}
        <div className="max-w-4xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "bg-gradient-to-r from-neutral-900/95 via-red-950/20 to-neutral-900/95 border-red-500/50 shadow-[0_8px_32px_rgba(224,77,77,0.18)] -translate-y-0.5 animate-[faqCardGlow_4s_ease-in-out_infinite]"
                    : "bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900/50 hover:-translate-y-0.5 hover:shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
                }`}
              >
                {/* Active Top Accent Line */}
                {isOpen && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                )}

                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`shrink-0 text-xs font-mono font-bold transition-colors duration-200 ${
                        isOpen ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-[#E04D4D] group-hover:text-red-400"
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span
                      className={`text-sm sm:text-base font-bold tracking-tight transition-colors duration-200 ${
                        isOpen ? "text-white" : "text-neutral-100 group-hover:text-white"
                      }`}
                    >
                      {faq.q}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:border-neutral-700 transition-colors">
                      {faq.badge}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                          : "border-neutral-800 text-neutral-500 group-hover:text-neutral-300 group-hover:border-neutral-700"
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-3.5 border-t border-neutral-800/60 text-xs sm:text-sm text-neutral-300 leading-relaxed space-y-3">
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
                            className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 hover:border-red-500/40 hover:bg-neutral-900/70 hover:scale-[1.01] flex items-start gap-3 transition-all duration-200 animate-[textReveal_0.45s_cubic-bezier(0.16,1,0.3,1)_both]"
                            style={{ animationDelay: `${(fIdx + 1) * 75}ms` }}
                          >
                            <span className="text-lg select-none shrink-0">{feat.icon}</span>
                            <div>
                              <span className="font-bold text-white text-xs block">
                                {feat.title}
                              </span>
                              <span className="text-[11px] text-neutral-400 leading-tight block mt-0.5">
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
        <div className="max-w-4xl mx-auto mt-8 p-4 sm:p-5 rounded-2xl border border-neutral-800/80 bg-neutral-950/70 hover:border-neutral-700 hover:bg-neutral-900/40 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 flex items-center gap-4 text-xs text-neutral-400 group">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 group-hover:border-amber-500/40 transition-all flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-neutral-200 block text-xs">
              Official Competitive Programming Platforms
            </span>
            <span className="text-[11px] text-neutral-400 leading-relaxed block mt-0.5">
              For official problem submissions, contest ratings, and original editorial analysis, please visit and support{" "}
              <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline font-medium">LeetCode</a>,{" "}
              <a href="https://codeforces.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-medium">Codeforces</a>,{" "}
              and{" "}
              <a href="https://takeuforward.org" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline font-medium">takeUforward (TUF / Striver)</a>.
            </span>
          </div>
        </div>
      </section>

      {/* 50% Centered Red Accent Line Divider */}
      <div className="relative z-10 w-full flex justify-center py-6">
        <div className="w-1/2 max-w-2xl h-[2px] bg-gradient-to-r from-transparent via-[#E04D4D] to-transparent rounded-full shadow-[0_0_12px_rgba(224,77,77,0.45)] animate-[dividerGlow_3.5s_ease-in-out_infinite]" />
      </div>

      {/* 8. Footer */}
      <footer className="relative z-10 border-t border-neutral-900/60 bg-[#030005] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content Grid */}
          {/* Main Footer Content */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-16 pb-10 border-b border-neutral-900">
            {/* Left: Powered by RK COACHING CLASSES (Prominent Branding) */}
            <div className="max-w-xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-[#E04D4D] text-[10px] font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Academic & Institutional Patron</span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-semibold block mb-1">
                  Powered by
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  RK COACHING CLASSES
                </h4>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
                A premier academic institution and family business in Balotra, Rajasthan — dedicated to igniting curiosity, mathematical rigor, and student excellence for more than ten years.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Balotra, Rajasthan
                </span>
                <span className="text-neutral-700">•</span>
                <span>Family-Run Academic Legacy</span>
                <span className="text-neutral-700">•</span>
                <span>10+ Years of Proven Mentorship</span>
              </div>

              {/* Verified Google Reviews Button */}
              <div className="pt-3">
                <a
                  href="https://www.google.com/search?kgmid=/g/11sw3lygl4&hl=en-IN&q=R.K+Coaching+Classes&shem=epsd1,ltae&shndl=30&source=sh/x/loc/osrp/m1/4&kgs=b766ce970394304d&utm_source=epsd1,ltae,sh/x/loc/osrp/m1/4&zx=1790988522881"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#080d1a] border border-blue-900/80 hover:border-amber-500/70 hover:bg-[#0c1324] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] active:scale-[0.98] transition-all duration-300 group"
                >
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="font-extrabold tracking-wider text-xs sm:text-sm uppercase text-neutral-100 group-hover:text-amber-300 transition-colors">
                    VIEW VERIFIED GOOGLE REVIEWS
                  </span>
                  <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-white group-hover:translate-x-1.5 transition-all duration-300 ml-0.5" />
                </a>
              </div>
            </div>

            {/* Right: Platform Navigation & Learning Network grouped and pinned right */}
            <div className="flex flex-col sm:flex-row gap-12 sm:gap-16 lg:gap-24 sm:ml-auto shrink-0 lg:pt-8">
              {/* Middle: Platform Navigation */}
              <div className="space-y-4 min-w-[180px]">
                <h5 className="text-sm font-bold uppercase tracking-wider text-neutral-100">
                  Platform Tools
                </h5>
                <ul className="space-y-3 text-sm text-neutral-300">
                  <li>
                    <Link to="/practice" className="hover:text-white transition-colors flex items-center gap-2.5">
                      <Terminal className="w-4.5 h-4.5 text-[#E04D4D]" />
                      <span>Practice DSA (4,179+)</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/youtube" className="hover:text-white transition-colors flex items-center gap-2.5">
                      <Play className="w-4.5 h-4.5 text-red-400" />
                      <span>Ad - free Video</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/prephub" className="hover:text-white transition-colors flex items-center gap-2.5">
                      <BookOpen className="w-4.5 h-4.5 text-amber-400" />
                      <span>Workspace Roadmaps</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="hover:text-white transition-colors flex items-center gap-2.5">
                      <Flame className="w-4.5 h-4.5 text-rose-400" />
                      <span>Student Dashboard</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Right: Learning Network & Channels */}
              <div className="space-y-4 max-w-[310px]">
                <h5 className="text-sm font-bold uppercase tracking-wider text-neutral-100">
                  Learning Network
                </h5>
                <div className="space-y-3 text-sm text-neutral-300">
                  <a
                    href="https://youtube.com/@rkcoachingclasses?si=KfYdwL2LGWjAbTTm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-white transition-colors group"
                  >
                    <Play className="w-4.5 h-4.5 text-red-500 group-hover:scale-110 transition-transform" />
                    <span>RK Coaching YouTube</span>
                    <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors ml-auto" />
                  </a>

                  <a
                    href="https://www.instagram.com/rk.coachings20?igsh=ajl5am10cTlyaGw5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-white transition-colors group"
                  >
                    <span className="w-4.5 h-4.5 flex items-center justify-center font-bold text-pink-400 text-xs group-hover:scale-110 transition-transform">
                      IG
                    </span>
                    <span>@rk.coachings20</span>
                    <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors ml-auto" />
                  </a>

                  <p className="text-xs text-neutral-400 pt-1 leading-relaxed">
                    Building deep conceptual foundations from school to advanced algorithmic engineering.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Brand, Copyright & Dedication */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            {/* Left: StudyBuddy Micro Brand */}
            <div className="flex items-center gap-2 text-neutral-400">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#BA3C3C] to-[#E04D4D] flex items-center justify-center text-white">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-sm text-neutral-200">StudyBuddy</span>
              <span className="text-[11px] text-neutral-500 font-mono">• Code • Study • Track</span>
            </div>

            {/* Middle: Copyright & Made with Love */}
            <div className="text-center">
              <p className="text-neutral-300 font-medium">
                © {new Date().getFullYear()} <span className="text-white font-semibold">Shubham Agrawal</span>. All rights reserved.
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5 flex items-center justify-center gap-1.5">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
                <span>for underdogs & ambitious learners</span>
              </p>
            </div>

            {/* Right: Platform Note */}
            <div className="text-xs text-neutral-500 text-center sm:text-right">
              Designed for Desktop, Laptop & Tablet.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
