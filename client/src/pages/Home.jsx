import { useState, useEffect } from "react";
import Loader from "../components/common/Loader";
import AnimatedBackground from "../components/background/AnimatedBackground";
import HeroSection from "../components/web/HeroSection";
import InteractivePreview from "../components/web/InteractivePreview";
import FeaturesSection from "../components/web/FeaturesSection";
import PricingSection from "../components/web/PricingSection";
import FAQSection from "../components/web/FAQSection";
import FooterSection from "../components/web/FooterSection";

export default function Home() {
  const [loaderMounted, setLoaderMounted] = useState(true);
  const [loaderVisible, setLoaderVisible] = useState(true);

  useEffect(() => {
    // Stage 1: Hold overlay briefly, then start smooth fade out
    const fadeTimer = setTimeout(() => {
      setLoaderVisible(false);
    }, 320);

    // Stage 2: Cleanly unmount overlay after CSS opacity transition completes
    const unmountTimer = setTimeout(() => {
      setLoaderMounted(false);
    }, 850);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#030005] text-slate-900 dark:text-white overflow-x-hidden font-sans antialiased selection:bg-rose-200 selection:text-rose-900 dark:selection:bg-red-500/30 dark:selection:text-white">
      {/* Smooth Page Transition Dissolve Overlay */}
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

      <AnimatedBackground />

      {/* Modular Web Sections */}
      <HeroSection />
      <InteractivePreview />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
}
