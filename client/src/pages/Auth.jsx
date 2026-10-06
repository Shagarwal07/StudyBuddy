import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import BackgroundGlow from "../components/common/BackgroundGlow";
import Loader from "../components/common/Loader";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [loaderMounted, setLoaderMounted] = useState(true);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [isNavigatingHome, setIsNavigatingHome] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Smooth UI transition delay
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setLoaderVisible(false);
    }, 320);

    const unmountTimer = setTimeout(() => {
      setLoaderMounted(false);
    }, 850);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  // Smooth exit transition before returning home
  const handleReturnHome = (e) => {
    e?.preventDefault();
    if (isNavigatingHome) return;
    setIsNavigatingHome(true);
    setTimeout(() => {
      navigate("/");
    }, 200);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Real-time canvas processing to remove pure white background and ground studio shadow
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animId;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = 480;
    canvas.height = 480;

    video.muted = true;
    video.playsInline = true;

    // Instant poster fallback so canvas is populated while video initializes
    const poster = new Image();
    poster.src = "/assets/mascot_transparent.webp";
    poster.onload = () => {
      if (video.readyState < 2) {
        ctx.drawImage(poster, 0, 0, 480, 480);
      }
    };

    const playVideo = () => {
      video.play().catch(() => {});
    };

    video.addEventListener("canplay", playVideo);
    video.addEventListener("loadeddata", playVideo);
    playVideo();

    const processFrame = () => {
      if (video.readyState >= 2 && !video.paused && !video.ended) {
        const w = 480;
        const h = 480;

        ctx.drawImage(video, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        for (let y = 0; y < h; y++) {
          const rowOffset = y * w * 4;
          const isFloorArea = y > 0.78 * h;
          const isUnderSole = y >= 0.93 * h;

          for (let x = 0; x < w; x++) {
            const i = rowOffset + x * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const minVal = r < g ? (r < b ? r : b) : g < b ? g : b;

            // 1. Key out pure white background (preserves off-white cap & pants at ~220-234)
            if (minVal > 244) {
              data[i + 3] = 0;
            } else if (minVal > 234 && !isFloorArea) {
              data[i + 3] = Math.round(((244 - minVal) / 10) * 255);
            } else if (isFloorArea) {
              // 2. Key out studio floor shadow (which appears as a bright white disk on dark bg)
              const isLateralShadow = (x < 0.33 * w || x > 0.68 * w) && minVal > 165;
              if (isUnderSole || isLateralShadow || minVal > 234) {
                data[i + 3] = 0;
              }
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);

    return () => {
      video.removeEventListener("canplay", playVideo);
      video.removeEventListener("loadeddata", playVideo);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const handleGoogleResponse = useCallback(async (response) => {
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/google", { credential: response.credential });
      if (res.data?.success) {
        login(res.data.token, res.data.user);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Google authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [login, navigate]);

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Client ID is missing in client/.env.");
      return;
    }
    if (window.google?.accounts?.id) {
      setLoading(true);
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason?.() || "browser restrictions";
          setError(`Google Sign-In prompt was not displayed (${reason}). Please click again or allow popups.`);
          setLoading(false);
        } else if (notification.isSkippedMoment?.() || notification.isDismissedMoment?.()) {
          setLoading(false);
        }
      });
    } else {
      setError("Google Identity Services failed to load. Check your internet connection.");
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const container = document.getElementById("googleBtnDiv");
        if (container) {
          container.innerHTML = "";
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            shape: "rectangular",
            width: 320,
            text: "signin_with",
          });
        }
      } catch (err) {
        console.error("Failed to initialize Google Sign-In:", err);
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    }
  }, [handleGoogleResponse]);

  return (
    <div
      className={`w-full h-screen overflow-hidden flex flex-col bg-[#030005] relative text-[#EDE9E3] font-['Lora',serif] select-none transition-all duration-200 ease-out ${
        isNavigatingHome ? "opacity-0 scale-[0.99] pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* SMOOTH UI PAGE TRANSITION DISSOLVE OVERLAY */}
      {loaderMounted && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-500 ease-out pointer-events-none ${
            loaderVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <Loader
            text="Loading StudyBuddy..."
            subtitle="Preparing secure authentication."
            fullscreen
          />
        </div>
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime:wght@400;700&display=swap');

        .iws-noise-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `,
        }}
      />

      {/* SIGNATURE STUDYBUDDY BACKGROUND GLOW */}
      <BackgroundGlow />

      {/* NOISE OVERLAY */}
      <div className="iws-noise-overlay absolute inset-0 pointer-events-none z-10" />

      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-red-500/12 blur-3xl pointer-events-none -z-10" />

      {/* BACKGROUND "STUDYBUDDY" WATERMARK */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] z-0 select-none">
        <div className="relative flex items-center justify-center">
          <div
            className="text-[#E04D4D] font-['Fraunces',serif] font-black leading-none tracking-tighter whitespace-nowrap"
            style={{
              fontSize: "clamp(80px, 22vw, 380px)",
              transformOrigin: "center",
            }}
          >
            STUDYBUDDY
          </div>
        </div>
      </div>

      {/* CLEAN HEADER */}
      <header className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5">
        <a
          href="/"
          onClick={handleReturnHome}
          className="flex items-center gap-3.5 group cursor-pointer select-none"
        >
          <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#BA3C3C] to-[#E04D4D] flex items-center justify-center text-white font-mono font-bold text-base sm:text-lg shadow-[0_0_20px_rgba(224,77,77,0.35)] shrink-0 group-hover:scale-105 transition-transform duration-200">
            &lt;/&gt;
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white font-['Fraunces',serif] font-bold text-xl sm:text-2xl tracking-tight leading-tight group-hover:text-white/90 transition-colors">
              StudyBuddy
            </span>
            <span className="text-neutral-400 font-['Courier_Prime',monospace] font-bold text-[10px] sm:text-[11px] tracking-wider leading-tight mt-0.5">
              Code • Study • Track
            </span>
            <span className="text-[#E04D4D] font-['Courier_Prime',monospace] font-bold text-[10px] sm:text-[11px] tracking-wider leading-tight mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E04D4D] inline-block animate-pulse shrink-0" />
              Powered by RK Coaching Classes
            </span>
          </div>
        </a>
      </header>

      {/* CENTER VIDEO PLAYING WITH REAL-TIME TRANSPARENT CANVAS ON OUR DARK BG */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[100vw] h-[60vh] sm:w-[70vw] sm:h-[70vh] md:w-[62vw] md:h-[78vh] flex items-center justify-center">
          {/* Hidden Source Video */}
          <video
            ref={videoRef}
            src="/assets/mascot_video.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            className="hidden"
            onLoadedData={() => videoRef.current?.play().catch(() => {})}
            onCanPlay={() => videoRef.current?.play().catch(() => {})}
          />

          {/* Real-time Keyed Canvas (Zero white box, 100% solid cap & pants) */}
          <canvas
            ref={canvasRef}
            width={480}
            height={480}
            className="w-full h-full object-contain pointer-events-none relative z-10 drop-shadow-[0_12px_45px_rgba(0,0,0,0.85)]"
          />
        </div>
      </div>

      {/* BOTTOM ACTION */}
      <div className="relative z-30 pb-8 sm:pb-12 pt-4 px-6 flex flex-col items-center mt-auto">
        <div className="relative w-[90%] sm:w-auto min-w-[280px]">
          {/* Invisible Google One-Tap/Button Overlay */}
          <div
            id="googleBtnDiv"
            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer overflow-hidden flex items-center justify-center"
          />

          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full bg-[#120E1E] text-white hover:bg-[#1A142A] border-[1.5px] border-[#E04D4D] py-4 sm:py-5 px-8 rounded-none font-bold text-sm sm:text-base font-['Courier_Prime',monospace] tracking-widest uppercase shadow-[5px_5px_0_#E04D4D] transition-all duration-300 flex items-center justify-center gap-4 hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer relative z-10"
          >
            {loading ? (
              <div className="w-7 h-7 sm:w-8 sm:h-8 border-4 border-[#A2382B] border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <svg className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{loading ? "Connecting..." : "Sign in with Google"}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-none bg-red-500/10 border border-[#E04D4D] text-[#E04D4D] text-xs font-['Courier_Prime',monospace] text-center max-w-md shadow-md">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleReturnHome}
          disabled={isNavigatingHome}
          className="mt-8 text-neutral-400 font-['Courier_Prime',monospace] text-[12px] tracking-[0.06em] font-bold border-b-[1.5px] border-neutral-700 pb-[2px] hover:text-[#E04D4D] hover:border-[#E04D4D] active:scale-95 transition-all flex items-center gap-2 group cursor-pointer disabled:opacity-60"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isNavigatingHome ? "-translate-x-1 text-[#E04D4D]" : "group-hover:-translate-x-1"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>{isNavigatingHome ? "Returning to home..." : "Return to home"}</span>
        </button>
      </div>
    </div>
  );
}
