import { useState } from "react";
import BackgroundGlow from "../common/BackgroundGlow";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children, title, showBack = false, className = "" }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030005] text-white transition-colors duration-300">
      <BackgroundGlow />

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main application layout */}
      <main className={`relative z-10 mx-auto min-h-screen max-w-[1600px] ${className}`}>
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
