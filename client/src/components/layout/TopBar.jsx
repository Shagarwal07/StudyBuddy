import { useState, useEffect, useRef } from "react";
import {
  Menu,
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  LogIn,
  LayoutDashboard,
  Code2,
  Tv,
  GraduationCap,
  Settings,
  ChevronDown,
  Home,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

function StreakFlameIcon({ active = false }) {
  if (!active) {
    return (
      <svg
        className="w-4 h-4 shrink-0 text-neutral-500 transition-colors"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    );
  }

  return (
    <svg
      className="w-4 h-4 shrink-0 drop-shadow-[0_0_8px_rgba(249,115,22,0.7)] animate-pulse transition-transform duration-300 group-hover:scale-110"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="activeFlameGrad" x1="0%" y1="100%" x2="30%" y2="0%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="50%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
        fill="url(#activeFlameGrad)"
        stroke="#F97316"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopBar({ title, showBack = false, onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { user, streak, logout, isAuthenticated } = useAuth();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Infer page title from route if not explicitly provided
  const getPageTitle = () => {
    if (title) return title;
    const path = location.pathname;
    if (path === "/") return "Home";
    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/practice")) return "Practice Studio";
    if (path.startsWith("/youtube")) return "Ad - free Video";
    if (path.startsWith("/prephub")) return "Workspace";
    if (path.startsWith("/profile")) return "Profile";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/library")) return "Ad - free Video";
    if (path.startsWith("/playlist")) return "Video Player";
    return "StudyBuddy";
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
      navigate("/login");
    } else {
      navigate("/login");
    }
  };

  const displayTitle = getPageTitle();
  const displayBadge = user?.badge && user.badge !== "Basic User" ? user.badge : "";
  const badgeLabel = displayBadge || user?.name || "Account";
  const displayStreak = Number(streak) || 0;

  const quickNav = [
    { name: "Home", path: "/", icon: Home },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Practice", path: "/practice", icon: Code2 },
    { name: "Ad - free Video", path: "/youtube", icon: Tv },
    { name: "Workspace", path: "/prephub", icon: GraduationCap },
  ];

  const isNavActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/dashboard") return location.pathname === "/dashboard";
    if (path === "/youtube") return location.pathname === "/youtube" || location.pathname === "/library" || location.pathname.startsWith("/playlist");
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#252033]/90 bg-[#0E0C15]/95 backdrop-blur-xl shrink-0 transition-colors shadow-[0_4px_24px_rgba(0,0,0,0.55)]">
      {/* Hairline Crimson Glow Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#E04D4D]/80 to-transparent" />

      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 gap-3">
        {/* Left: Upscaled Branding & Context */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-baseline font-brand tracking-tight group cursor-pointer text-left focus:outline-none select-none py-1"
            title="StudyBuddy Dashboard"
          >
            <span className="text-lg sm:text-xl font-bold text-white group-hover:text-neutral-100 transition-colors">
              Study
            </span>
            <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-[#FF4D4D] via-[#FF6E6E] to-[#FFA270] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,77,77,0.35)]">
              Buddy
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-0.5 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
          </button>

          {/* Back Button (if requested) */}
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 transition text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* Breadcrumb / Page Title */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400 font-mono pl-1">
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-300 font-medium truncate max-w-[160px]">{displayTitle}</span>
          </div>
        </div>

        {/* Center: Desktop Quick Nav Tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#15121F]/80 p-1 rounded-xl border border-neutral-800/70 shadow-inner">
          {quickNav.map((item) => {
            const active = isNavActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  active
                    ? "bg-red-500/15 text-red-400 border border-red-500/30 font-semibold shadow-[0_0_12px_rgba(224,77,77,0.2)]"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-red-400" : "text-neutral-500"}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Streak & Badge-Triggered Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Streak Pill */}
          <div
            title={
              displayStreak > 0
                ? `Current Daily Streak: ${displayStreak} Day${displayStreak === 1 ? "" : "s"}`
                : "No active streak (0 days). Complete a study session or problem today to light up your streak!"
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs select-none transition group cursor-default ${
              displayStreak > 0
                ? "bg-gradient-to-r from-orange-500/15 via-[#18111B] to-red-500/15 border border-orange-500/35 hover:border-orange-400/60 shadow-[0_0_12px_rgba(249,115,22,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]"
                : "bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-300"
            }`}
          >
            <StreakFlameIcon active={displayStreak > 0} />
            <span
              className={`font-mono text-xs ${
                displayStreak > 0
                  ? "font-bold tracking-tight bg-gradient-to-r from-amber-200 via-orange-300 to-amber-100 bg-clip-text text-transparent"
                  : "font-medium text-neutral-400"
              }`}
            >
              {displayStreak > 0 ? `${displayStreak}d` : "0"}
            </span>
          </div>

          {/* User Badge / Profile Menu Trigger */}
          {isAuthenticated ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer select-none text-xs group ${
                  isProfileMenuOpen
                    ? "bg-neutral-800/90 border-neutral-700 text-white shadow-[0_0_16px_rgba(224,77,77,0.15)] ring-1 ring-red-500/30"
                    : "bg-neutral-900/80 hover:bg-neutral-800/90 border-neutral-800 hover:border-neutral-700 text-neutral-300 shadow-sm"
                }`}
                title="Open Profile, Settings & Menu"
              >
                {/* Monogram / Picture Avatar */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-amber-500 p-[1.5px] shrink-0 shadow-xs">
                  {user?.avatar || user?.picture ? (
                    <img
                      src={user.avatar || user.picture}
                      alt={user?.name || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#14111D] flex items-center justify-center font-bold text-[10px] text-white">
                      {(user?.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <span className="text-xs font-medium text-neutral-200 group-hover:text-white transition-colors max-w-[120px] sm:max-w-[160px] truncate">
                  {user?.name || badgeLabel}
                </span>

                {displayBadge && (
                  <span
                    className="text-[9px] px-1.5 py-0.2 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0 hidden md:inline-block"
                    title={displayBadge}
                  >
                    {displayBadge}
                  </span>
                )}

                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-200 transition-transform duration-200 shrink-0 ${
                    isProfileMenuOpen ? "rotate-180 text-white" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#120F1C]/95 border border-[#2D263D] shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(224,77,77,0.15)] p-2 z-50 backdrop-blur-xl animate-fade-in text-xs space-y-1">
                  {/* User Profile Header Card */}
                  <div className="p-2.5 rounded-xl bg-[#171324]/80 border border-[#262035] flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 via-amber-500/20 to-red-500/10 border border-red-500/30 flex items-center justify-center font-bold text-sm text-red-300 shrink-0">
                      {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : "U")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-neutral-100 truncate">
                        {user?.name || user?.email?.split("@")[0] || "Account"}
                      </p>
                      {user?.email && (
                        <p className="text-[10px] text-neutral-400 truncate font-mono">
                          {user.email}
                        </p>
                      )}
                      {displayBadge && (
                        <span className="inline-block mt-1 text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {displayBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-[1px] bg-neutral-800/80 my-1" />

                  {/* Settings & Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate("/settings");
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition text-left cursor-pointer group"
                  >
                    <Settings className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-colors" />
                    <span className="text-xs font-medium">Settings & Profile</span>
                  </button>

                  {/* Theme Mode Toggle Row */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      {isDark ? (
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className="text-xs font-medium">
                        {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                      {isDark ? "Dark" : "Light"}
                    </span>
                  </button>

                  {/* Navigation Sidebar Drawer */}
                  {onMenuClick && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onMenuClick();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition text-left cursor-pointer group"
                    >
                      <Menu className="w-3.5 h-3.5 text-neutral-400 group-hover:text-red-400 transition-colors" />
                      <span className="text-xs font-medium">Open Full Sidebar</span>
                    </button>
                  )}

                  <div className="h-[1px] bg-neutral-800/80 my-1" />

                  {/* Sign Out */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleAuthAction();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition text-left cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="text-xs">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 transition cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
