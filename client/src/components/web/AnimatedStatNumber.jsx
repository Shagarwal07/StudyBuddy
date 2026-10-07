import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

/**
 * AnimatedStatNumber:
 * - 600ms smooth count-up animation for numeric stats
 * - Styled in JetBrains Mono / monospace at 36px font size
 * - Respects prefers-reduced-motion
 */
export default function AnimatedStatNumber({ value, className = "" }) {
  const { isWeb } = useTheme();
  const [displayVal, setDisplayVal] = useState(() => {
    // Check if value is pure number or string with number
    return value;
  });

  useEffect(() => {
    if (!isWeb) {
      setDisplayVal(value);
      return;
    }

    // Check prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayVal(value);
      return;
    }

    // Parse numeric portion if possible
    const str = String(value ?? 0);
    const match = str.match(/^(\d+)(.*)$/);
    if (!match) {
      setDisplayVal(value);
      return;
    }

    const targetNum = parseInt(match[1], 10);
    const suffix = match[2] || "";

    if (isNaN(targetNum) || targetNum === 0) {
      setDisplayVal(value);
      return;
    }

    const duration = 600; // 600ms
    const start = performance.now();

    let animationFrameId;

    const animate = (time) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * targetNum);

      setDisplayVal(`${current}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [value, isWeb]);

  if (!isWeb) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span
      className={`font-mono text-[34px] sm:text-[36px] font-semibold tracking-tight text-[var(--bone)] leading-none ${className}`}
    >
      {displayVal}
    </span>
  );
}
