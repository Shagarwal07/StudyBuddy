import { useState } from "react";
import BackgroundGlow from "../common/BackgroundGlow";
import HeroWeb from "../web/HeroWeb";
import { useTheme } from "../../context/ThemeContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children, title, showBack = false, className = "" }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isWeb } = useTheme();

  return (
    <div
      className="relative min-h-screen overflow-hidden text-slate-900 dark:text-white bg-[var(--bg-main)] transition-colors duration-300 selection:bg-rose-200 selection:text-rose-900 dark:selection:bg-red-500/30 dark:selection:text-white"
    >
      {!isWeb && <BackgroundGlow />}
      {isWeb && (
        <>
          <HeroWeb position="tr" size={520} />
          <HeroWeb position="bl" size={240} />
        </>
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main application layout */}
      <main
        className={`relative z-10 mx-auto min-h-screen max-w-[1600px] ${className}`}
      >
        <TopBar
          title={title}
          showBack={showBack}
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
        />

        {children}
      </main>
    </div>
  );
}
