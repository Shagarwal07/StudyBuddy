import { useEffect } from "react";
import {
  Home,
  LayoutDashboard,
  Code2,
  Tv,
  GraduationCap,
  Settings,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const closeSidebar = () => {
    setIsOpen(false);
  };

  const navItems = [
    {
      name: "Home",
      icon: Home,
      path: "/",
      description: "Landing & Overview",
    },
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      description: "Overview & Streak",
    },
    {
      name: "Practice",
      icon: Code2,
      path: "/practice",
      description: "Coding Problem Studio",
    },
    {
      name: "Ad - free Video",
      icon: Tv,
      path: "/youtube",
      description: "Courses & Single Videos",
    },
    {
      name: "Workspace",
      icon: GraduationCap,
      path: "/prephub",
      description: "Interview Roadmaps & CS",
    },
    {
      name: "Setting",
      icon: Settings,
      path: "/settings",
      description: "Preferences & Profile",
    },
  ];

  const isItemActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    if (path === "/youtube") {
      return (
        location.pathname === "/youtube" ||
        location.pathname === "/library" ||
        location.pathname.startsWith("/playlist")
      );
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setIsOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 flex flex-col justify-between p-5 border-l border-neutral-800 bg-[#030005]/95 backdrop-blur-xl transition-transform duration-200 ease-out shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => {
                closeSidebar();
                navigate("/dashboard");
              }}
              className="flex items-baseline font-brand tracking-tight group cursor-pointer text-left focus:outline-none select-none py-1"
            >
              <span className="text-lg sm:text-xl font-bold text-white group-hover:text-neutral-100 transition-colors">
                Study
              </span>
              <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-[#FF4D4D] via-[#FF6E6E] to-[#FFA270] bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(255,77,77,0.35)]">
                Buddy
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-0.5 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            </button>

            <button
              onClick={closeSidebar}
              aria-label="Close sidebar"
              className="p-1.5 rounded-lg bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items (Exactly 5 buttons) */}
          <nav className="space-y-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.path);

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={closeSidebar}
                  title={item.name}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active
                      ? "bg-red-500/10 border border-red-500/25 text-red-400 shadow-sm"
                      : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/50 border border-transparent"
                    }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${active ? "text-red-400" : "text-neutral-400"
                      }`}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate leading-none">{item.name}</span>
                    <span
                      className={`text-[10px] truncate font-normal mt-1 leading-none ${active ? "text-red-400/80" : "text-neutral-500"
                        }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between px-1 text-[11px] text-neutral-500 font-mono">
          <span>StudyBuddy v2.0</span>
          <span>Focus & Practice</span>
        </div>
      </aside>
    </>
  );
}
