import { useState, useEffect, useRef } from "react";

export default function TypewriterText({
  text = "",
  speed = 55,
  delay = 300,
  className = "",
  cursor = true,
  quote = false,
}) {
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
