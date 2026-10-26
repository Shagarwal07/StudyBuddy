import { useState, useMemo, useRef, useEffect } from "react";
import { Play } from "lucide-react";

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

export default function InteractivePreview() {
  const [activeTab, setActiveTab] = useState("optimal");

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

  return (
    <>
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
                <div className="absolute inset-0 rounded-full bg-red-500/20 blur-xl group-hover:bg-red-500/35 transition-all" />
                <img
                  src="/assets/red-bug-3d.png"
                  alt="3D Syntax Bot"
                  className="relative w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-[0_10px_20px_rgba(239,68,68,0.5)] group-hover:scale-105 active:scale-95 transition-transform"
                />
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-white blur-[2px] animate-[muzzleFlash_0.7s_ease-in-out_infinite] pointer-events-none" />
              </div>

              {/* Bot 1 HUD */}
              <div className="hidden sm:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono font-extrabold tracking-wider text-red-400">P1: SYNTAX_BOT</span>
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-red-500/20 text-red-300 border border-red-500/30">Lv.99</span>
                </div>
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
              <div className="w-full h-[3px] rounded-full bg-gradient-to-r from-red-500/80 via-neutral-800 to-cyan-500/80 relative shadow-[0_0_12px_rgba(239,68,68,0.3)]">
                {/* Laser Bullets Left -> Right */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-r from-transparent via-amber-300 to-red-500 shadow-[0_0_10px_#ef4444] animate-[laserStreamLR_1.2s_linear_infinite]"
                  style={{ width: "35px" }}
                />
                {/* Laser Bullets Right -> Left */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-l from-transparent via-cyan-200 to-cyan-400 shadow-[0_0_10px_#06b6d4] animate-[laserStreamRL_1.4s_linear_infinite]"
                  style={{ width: "35px" }}
                />

                {/* Central Collision Clash Core */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500/40 via-amber-400/40 to-cyan-500/40 blur-md animate-[clashPulse_0.6s_ease-in-out_infinite]" />
                  <div className="relative px-2.5 py-0.5 rounded-full bg-black/90 border border-neutral-700/80 text-[10px] font-mono font-black tracking-widest text-white shadow-[0_0_15px_rgba(255,255,255,0.4)] whitespace-nowrap">
                    {battleState.critText}
                  </div>
                </div>
              </div>
            </div>

            {/* Player 2: 3D Cyan Robot Bug */}
            <div
              onClick={fireP2}
              className={`group flex items-center gap-3 cursor-pointer select-none transition-transform duration-200 ${
                battleState.p2Recoil ? "animate-[recoilRight_0.4s_ease-out]" : "animate-[bugBobRight_2.8s_ease-in-out_infinite]"
              }`}
              title="Click to fire Logic Plasma!"
            >
              {/* Bot 2 HUD */}
              <div className="hidden sm:flex flex-col text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Lv.99</span>
                  <span className="text-[11px] font-mono font-extrabold tracking-wider text-cyan-400">P2: LOGIC_CORE</span>
                </div>
                <div className="w-24 h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden mt-1 relative ml-auto">
                  <div
                    className="h-full bg-gradient-to-l from-cyan-500 to-blue-400 transition-all duration-300 shadow-[0_0_8px_#06b6d4]"
                    style={{ width: `${battleState.p2Hp}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-neutral-400 mt-0.5">HP {battleState.p2Hp}/100</span>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl group-hover:bg-cyan-500/35 transition-all" />
                <img
                  src="/assets/cyan-bug-3d.png"
                  alt="3D Logic Bot"
                  className="relative w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-[0_10px_20px_rgba(6,182,212,0.5)] group-hover:scale-105 active:scale-95 transition-transform"
                />
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-l from-cyan-400 via-blue-300 to-white blur-[2px] animate-[muzzleFlash_0.8s_ease-in-out_infinite] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Tier Algorithmic Code Preview Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 pb-16">
        <div className="relative rounded-2xl bg-white/95 dark:bg-[#0c0914]/90 border border-slate-300/80 dark:border-neutral-800/80 shadow-xl dark:shadow-[0_15px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 dark:border-neutral-800/80 bg-slate-50/90 dark:bg-neutral-950/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span className="ml-2 text-xs font-mono text-slate-500 dark:text-neutral-400">
                15. 3Sum — Java 17
              </span>
            </div>

            {/* Tabs for Optimal, Better, Brute */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-neutral-900/90 border border-slate-300/80 dark:border-neutral-800">
              <button
                onClick={() => setActiveTab("optimal")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "optimal"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Optimal O(N²)
              </button>
              <button
                onClick={() => setActiveTab("better")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "better"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Better O(N²·logN)
              </button>
              <button
                onClick={() => setActiveTab("brute")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "brute"
                    ? "bg-red-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Brute O(N³)
              </button>
            </div>
          </div>

          {/* Code Viewer Body */}
          <div className="p-4 sm:p-6 bg-neutral-950 font-mono text-xs overflow-x-auto min-h-[300px]">
            <AnimatedCodeBlock lines={CODE_SNIPPETS[activeTab]} activeTab={activeTab} />
          </div>

          {/* Footer Bar showing complexity & test status */}
          <div className="px-4 py-3 bg-slate-100/90 dark:bg-neutral-950/90 border-t border-slate-200 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-slate-500 dark:text-neutral-400">
                Time:{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {activeTab === "optimal" ? "O(N²)" : activeTab === "better" ? "O(N²·log M)" : "O(N³)"}
                </span>
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-neutral-400">
                Space:{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {activeTab === "optimal" ? "O(1)" : activeTab === "better" ? "O(N)" : "O(N)"}
                </span>
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-neutral-400">
              Runtime:{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                {activeTab === "optimal" ? "24 ms" : activeTab === "better" ? "188 ms" : "1,420 ms"}
              </span>{" "}
              • Tests:{" "}
              <span
                className={
                  activeTab === "optimal" || activeTab === "better"
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-amber-600 dark:text-amber-400 font-semibold"
                }
              >
                {activeTab === "brute" ? "312/312 Passed (TLE warning)" : "312/312 Passed"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
