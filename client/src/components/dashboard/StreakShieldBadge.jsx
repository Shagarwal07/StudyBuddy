import { useMemo } from "react";

export default function StreakShieldBadge({ currentStreak = 0, longestStreak = 0 }) {
  const displayDays = Math.max(0, Number(currentStreak) || 0);
  const bestDays = Math.max(displayDays, Number(longestStreak) || 0);
  const isBest = displayDays > 0 && displayDays >= bestDays;

  // Streak milestone progression calculations
  const { nextMilestone, progressPercent } = useMemo(() => {
    const milestones = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
    const next = milestones.find((m) => m > displayDays) || displayDays + 50;
    const prev = [...milestones].reverse().find((m) => m <= displayDays) || 0;
    const range = Math.max(1, next - prev);
    const progress = Math.min(
      100,
      Math.max(6, Math.round(((displayDays - prev) / range) * 100))
    );
    return { nextMilestone: next, progressPercent: progress };
  }, [displayDays]);

  // Circumference for r=78 milestone arc: 2 * π * 78 ≈ 490
  const circumference = 490;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none group w-full h-full">
      {/* Scoped Keyframe Animations for Buttery 60fps Gyroscope Motion */}
      <style>{`
        @keyframes sb-gyro-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes sb-gyro-ccw {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes sb-flame-flicker {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.95; }
          50% { transform: scale(1.1) translateY(-1.5px); opacity: 1; filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.85)); }
        }
        @keyframes sb-core-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.96); }
          50% { opacity: 0.45; transform: scale(1.04); }
        }
      `}</style>

      {/* 4 Corner High-Tech Tactical HUD Crosshairs */}
      <div className="absolute top-2.5 left-2.5 text-red-500/40 pointer-events-none transition-colors group-hover:text-red-400">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M 0 5 L 0 0 L 5 0" />
          <circle cx="2" cy="2" r="0.8" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute top-2.5 right-2.5 text-red-500/40 pointer-events-none transition-colors group-hover:text-red-400">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M 11 0 L 16 0 L 16 5" />
          <circle cx="14" cy="2" r="0.8" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-2.5 left-2.5 text-red-500/40 pointer-events-none transition-colors group-hover:text-red-400">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M 0 11 L 0 16 L 5 16" />
          <circle cx="2" cy="14" r="0.8" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute bottom-2.5 right-2.5 text-red-500/40 pointer-events-none transition-colors group-hover:text-red-400">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M 11 16 L 16 16 L 16 11" />
          <circle cx="14" cy="14" r="0.8" fill="currentColor" />
        </svg>
      </div>

      {/* Main Gyro-Core Vector Graphics Container */}
      <div className="relative flex flex-col items-center justify-center transition-transform duration-300 group-hover:scale-[1.03]">
        {/* Ambient Subtle Plasma Backlight */}
        <div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-red-600/20 via-rose-600/10 to-red-950/20 blur-xl pointer-events-none"
          style={{ animation: "sb-core-pulse 4s ease-in-out infinite" }}
        />

        <div className="relative w-44 h-52 sm:w-48 sm:h-56">
          <svg
            viewBox="0 0 200 240"
            className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Outer Gyro Ring Gradient */}
              <linearGradient id="gyroOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#7f1d1d" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.75" />
              </linearGradient>

              {/* Milestone Progress Arc Gradient */}
              <linearGradient id="milestoneArcGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff7070" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>

              {/* Inner Hex Chamber Dark Core */}
              <radialGradient id="hexCoreGrad" cx="50%" cy="38%" r="65%">
                <stop offset="0%" stopColor="#2e0912" />
                <stop offset="55%" stopColor="#170308" />
                <stop offset="100%" stopColor="#0a0104" />
              </radialGradient>

              {/* Hex Metallic Bezel Gradient */}
              <linearGradient id="hexRimGrad" x1="55" y1="52" x2="145" y2="158" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ff5757" />
                <stop offset="35%" stopColor="#dc2626" />
                <stop offset="70%" stopColor="#7f1d1d" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>

              {/* Lower Banner Plate Gradient */}
              <linearGradient id="plateGrad" x1="24" y1="181" x2="176" y2="181" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7f1d1d" />
                <stop offset="25%" stopColor="#b91c1c" />
                <stop offset="50%" stopColor="#dc2626" />
                <stop offset="75%" stopColor="#b91c1c" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>

            {/* ============================================================== */}
            {/* 1. ROTATING RING 1: OUTER GYROSCOPE (CLOCKWISE, 28s)           */}
            {/* ============================================================== */}
            <g
              style={{
                transformOrigin: "100px 105px",
                animation: "sb-gyro-cw 28s linear infinite",
              }}
              className="group-hover:[animation-duration:10s]"
            >
              {/* Outer Faint Calibrated Guide Circle */}
              <circle
                cx="100"
                cy="105"
                r="88"
                stroke="url(#gyroOuterGrad)"
                strokeWidth="1.2"
                strokeDasharray="4 8"
                opacity="0.65"
              />

              {/* 4 Segmented Cardinal Arc Brackets */}
              <path
                d="M 100 17 A 88 88 0 0 1 126 21"
                stroke="#ff4d4d"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 188 105 A 88 88 0 0 1 184 131"
                stroke="#ff4d4d"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 100 193 A 88 88 0 0 1 74 189"
                stroke="#ff4d4d"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 12 105 A 88 88 0 0 1 16 79"
                stroke="#ff4d4d"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* 4 Calibrated Cardinal Hash Marks */}
              <line x1="100" y1="13" x2="100" y2="21" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="184" y1="105" x2="192" y2="105" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="100" y1="189" x2="100" y2="197" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
              <line x1="8" y1="105" x2="16" y2="105" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
            </g>

            {/* ============================================================== */}
            {/* 2. CIRCULAR MILESTONE PROGRESS TRACK (STATIONARY RADIAL GAUGE) */}
            {/* ============================================================== */}
            {/* Background Track */}
            <circle
              cx="100"
              cy="105"
              r="78"
              stroke="#260b11"
              strokeWidth="2.5"
              opacity="0.8"
            />
            {/* Glowing Milestone Progress Arc */}
            <circle
              cx="100"
              cy="105"
              r="78"
              stroke="url(#milestoneArcGrad)"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 100 105)"
              className="transition-all duration-700 ease-out"
              style={{
                filter: "drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))",
              }}
            />

            {/* ============================================================== */}
            {/* 3. ROTATING RING 2: INNER CIRCUIT NODES (COUNTER-CLOCKWISE)    */}
            {/* ============================================================== */}
            <g
              style={{
                transformOrigin: "100px 105px",
                animation: "sb-gyro-ccw 18s linear infinite",
              }}
              className="group-hover:[animation-duration:7s]"
            >
              {/* Fine Dashed Circuit Ring */}
              <circle
                cx="100"
                cy="105"
                r="68"
                stroke="#631722"
                strokeWidth="1"
                strokeDasharray="2 10"
                opacity="0.75"
              />

              {/* 6 Circuit Nodes Evenly Spaced at 60° Intervals */}
              {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const nx = 100 + 68 * Math.cos(rad);
                const ny = 105 + 68 * Math.sin(rad);
                return (
                  <g key={idx}>
                    <circle cx={nx} cy={ny} r="2.2" fill="#ef4444" opacity="0.9" />
                    <circle cx={nx} cy={ny} r="0.9" fill="#ffffff" />
                  </g>
                );
              })}
            </g>

            {/* ============================================================== */}
            {/* 4. CENTER HEXAGON CHAMBER (CORE HOUSING)                       */}
            {/* ============================================================== */}
            {/* Main Outer Hexagon Plate */}
            <path
              d="M 100 52 L 145 78 L 145 132 L 100 158 L 55 132 L 55 78 Z"
              fill="url(#hexCoreGrad)"
              stroke="url(#hexRimGrad)"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />

            {/* Inner Fine Chamfer Bevel Ring */}
            <path
              d="M 100 59 L 138 82 L 138 128 L 100 151 L 62 128 L 62 82 Z"
              fill="none"
              stroke="#f87171"
              strokeWidth="1.2"
              strokeOpacity="0.35"
              strokeLinejoin="round"
            />

            {/* Top Flickering Plasma Flame */}
            <g
              transform="translate(100, 71)"
              style={{
                transformOrigin: "bottom center",
                animation: "sb-flame-flicker 2.2s ease-in-out infinite",
              }}
            >
              {/* Outer Corona */}
              <path
                d="M0 -11 C-1.5 -11 -5 -6 -5 -2 C-5 3 -2 6 0 7 C2 6 5 3 5 -2 C5 -6 1.5 -11 0 -11 Z"
                fill="#f43f5e"
                opacity="0.85"
              />
              {/* Mid Fiery Core */}
              <path
                d="M0 -8.5 C-1 -8.5 -3.5 -4 -3.5 -1 C-3.5 3 -1.5 5 0 5.8 C1.5 5 3.5 3 3.5 -1 C3.5 -4 1 -8.5 0 -8.5 Z"
                fill="#f97316"
              />
              {/* Hot White-Yellow Spark */}
              <path
                d="M0 -5.5 C-0.6 -5.5 -1.8 -2.5 -1.8 0 C-1.8 2.2 -0.8 3.5 0 4 C0.8 3.5 1.8 2.2 1.8 0 C1.8 -2.5 0.6 -5.5 0 -5.5 Z"
                fill="#fef08a"
              />
            </g>

            {/* Center Big Bold Streak Number */}
            <text
              x="100"
              y="114"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize="44"
              fontWeight="900"
              fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto"
              letterSpacing="-0.04em"
              style={{
                filter: "drop-shadow(0 2px 8px rgba(239,68,68,0.5))",
              }}
            >
              {displayDays}
            </text>

            {/* "DAYS" / "DAY" Monospace Label */}
            <text
              x="100"
              y="138"
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="10.5"
              fontWeight="800"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              letterSpacing="0.28em"
            >
              {displayDays === 1 ? "DAY" : "DAYS"}
            </text>

            {/* ============================================================== */}
            {/* 5. LOWER ANGULAR TECH PLATE (STATUS BANNER)                    */}
            {/* ============================================================== */}
            <g transform="translate(0, 12)">
              {/* Shadow Plate */}
              <path
                d="M 28 171 L 172 171 L 183 184 L 172 197 L 28 197 L 17 184 Z"
                fill="#000000"
                opacity="0.8"
              />
              {/* Front Plate Face */}
              <path
                d="M 26 169 L 174 169 L 185 182 L 174 195 L 26 195 L 15 182 Z"
                fill="url(#plateGrad)"
                stroke="#fda4af"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              {/* Top Bevel Highlight Rim */}
              <line
                x1="26"
                y1="169.5"
                x2="174"
                y2="169.5"
                stroke="#ffffff"
                strokeWidth="1"
                strokeOpacity="0.75"
              />
              {/* Plate Text */}
              <text
                x="100"
                y="183.5"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="900"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                letterSpacing="0.22em"
                style={{
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.9))",
                }}
              >
                {isBest ? "BEST STREAK" : "ACTIVE STREAK"}
              </text>
            </g>
          </svg>
        </div>

        {/* High-Tech Sub-Legend with Milestone Tracker */}
        <div className="flex flex-col items-center gap-0.5 mt-1 text-center font-mono select-none">
          <div className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-theme-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
            <span>{isBest ? "ALL-TIME RECORD" : `BEST: ${bestDays} DAYS`}</span>
          </div>
          <div className="text-[9px] tracking-wider text-theme-muted font-medium">
            TARGET: {nextMilestone}D ({displayDays}/{nextMilestone})
          </div>
        </div>
      </div>
    </div>
  );
}

