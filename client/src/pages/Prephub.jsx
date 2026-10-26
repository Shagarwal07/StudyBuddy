import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  GraduationCap,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Globe,
  Flame,
  Lock,
  Code2,
  Trash2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import AppShell, { SidebarTrigger } from "../components/layout/AppShell";
import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext";
import RkVerificationModal from "../components/modals/RkVerificationModal";

const SUBJECT_ICONS = {
  os: Cpu,
  dbms: Database,
  cn: Globe,
  sql: Database,
  "strivers-a2z": Layers,
  "strivers-180": Layers,
  "neetcode-150": Code2,
  "blind-75": Flame,
  "rk-classroom": GraduationCap,
  "codeforces-ladder": Flame,
};

export default function Prephub() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeGroup, setActiveGroup] = useState("core"); // 'core' | 'dsa' | 'rk'
  const [coreSubjects, setCoreSubjects] = useState([]);
  const [dsaSubjects, setDsaSubjects] = useState([]);
  const [rkSubjects, setRkSubjects] = useState([]);
  const [activeSubjectId, setActiveSubjectId] = useState("");
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState(null);

  // Current list based on selected group
  const currentList = useMemo(() => {
    if (activeGroup === "core") return coreSubjects;
    if (activeGroup === "dsa") return dsaSubjects;
    if (activeGroup === "rk") return rkSubjects;
    return [];
  }, [activeGroup, coreSubjects, dsaSubjects, rkSubjects]);

  // Horizontal Carousel scroll & side-fade mask state
  const carouselRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [currentList, updateScrollState]);

  const scrollCarousel = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Side fade mask inspired by carousel CSS
  const maskStyle = useMemo(() => {
    if (!canScrollLeft && !canScrollRight) return {};
    if (canScrollLeft && canScrollRight) {
      return {
        maskImage: "linear-gradient(to right, transparent, black 28px, black calc(100% - 28px), transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 28px, black calc(100% - 28px), transparent)",
      };
    }
    if (canScrollRight) {
      return {
        maskImage: "linear-gradient(to right, black calc(100% - 28px), transparent)",
        WebkitMaskImage: "linear-gradient(to right, black calc(100% - 28px), transparent)",
      };
    }
    if (canScrollLeft) {
      return {
        maskImage: "linear-gradient(to right, transparent, black 28px, black)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 28px, black)",
      };
    }
    return {};
  }, [canScrollLeft, canScrollRight]);

  // RK Coaching verification modals state
  const codeParam = searchParams.get("code") || searchParams.get("invite");
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(
    () => Boolean(codeParam && !user?.isRkStudent)
  );
  const [initialPasskey] = useState(() => (codeParam ? codeParam.toUpperCase() : ""));

  const navigate = useNavigate();

  // 1. Fetch subjects overview (both Core CS & DSA roadmaps)
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const res = await api.get("/prephub/subjects");
        if (res.data.success) {
          const core = res.data.coreSubjects || [];
          const dsa = res.data.dsaSubjects || [];
          const rk = res.data.rkSubjects || [];
          setCoreSubjects(core);
          setDsaSubjects(dsa);
          setRkSubjects(rk);

          // Default initial subject or query param
          const subjectParam = searchParams.get("subject") || searchParams.get("sheet");
          if (subjectParam) {
            const isDsa = dsa.some((s) => s.id === subjectParam);
            const isCore = core.some((s) => s.id === subjectParam);
            const isRk = rk.some((s) => s.id === subjectParam);
            if (isDsa) {
              setActiveGroup("dsa");
              setActiveSubjectId(subjectParam);
            } else if (isCore) {
              setActiveGroup("core");
              setActiveSubjectId(subjectParam);
            } else if (isRk) {
              setActiveGroup("rk");
              setActiveSubjectId(subjectParam);
            } else {
              setActiveSubjectId(subjectParam);
            }
          } else if (core.length > 0) {
            setActiveGroup("core");
            setActiveSubjectId(core[0].id);
          } else if (dsa.length > 0) {
            setActiveGroup("dsa");
            setActiveSubjectId(dsa[0].id);
          } else if (rk.length > 0) {
            setActiveGroup("rk");
            setActiveSubjectId(rk[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load prephub subjects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [searchParams]);

  // 2. Fetch active subject details whenever activeSubjectId changes
  useEffect(() => {
    if (!activeSubjectId) return;

    const fetchDetails = async () => {
      try {
        setDetailsLoading(true);
        const res = await api.get(`/prephub/subject/${activeSubjectId}`);
        if (res.data.success) {
          setSubjectDetails(res.data);
          // Expand first module by default
          if (res.data.modules && res.data.modules.length > 0) {
            setExpandedModuleId(res.data.modules[0].moduleId);
          }
        }
      } catch (err) {
        console.error("Failed to load subject details:", err);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [activeSubjectId]);

  const currentSubject = useMemo(() => {
    return (
      currentList.find((s) => s.id === activeSubjectId) ||
      coreSubjects.find((s) => s.id === activeSubjectId) ||
      dsaSubjects.find((s) => s.id === activeSubjectId) ||
      rkSubjects.find((s) => s.id === activeSubjectId) ||
      currentList[0]
    );
  }, [currentList, coreSubjects, dsaSubjects, rkSubjects, activeSubjectId]);

  const handleGroupChange = (group) => {
    setActiveGroup(group);
    if (group === "core") {
      setActiveSubjectId(coreSubjects[0]?.id || "");
    } else if (group === "dsa") {
      setActiveSubjectId(dsaSubjects[0]?.id || "strivers-180");
    } else if (group === "rk") {
      setActiveSubjectId(rkSubjects[0]?.id || "rk-classroom");
    }
  };

  const toggleModule = (modId) => {
    setExpandedModuleId((prev) => (prev === modId ? null : modId));
  };

  const isCurrentLocked = activeGroup === "rk" && !user?.isRkStudent;

  const handleOpenInStudio = async () => {
    if (isCurrentLocked) {
      toast.error("🔒 RK WORKSPACE curriculum is exclusive to RK Coaching Classes students.");
      setIsVerificationModalOpen(true);
      return;
    }
    const sheetId = currentSubject?.sheetId || activeSubjectId;
    try {
      await api.post("/practice/enroll", { sheetId });
    } catch {
      // ignore
    }
    navigate(`/practice?sheet=${encodeURIComponent(sheetId)}`);
  };



  const handleDeleteCard = async (sheetId) => {
    if (!window.confirm("Are you sure you want to permanently delete this roadmap from Workspace and Practice Studio?")) return;
    try {
      const res = await api.delete(`/practice/custom-sheet/${sheetId}`);
      if (res.data.success) {
        toast.success("Roadmap deleted successfully");
        const overviewRes = await api.get("/prephub/subjects");
        if (overviewRes.data.success) {
          const core = overviewRes.data.coreSubjects || [];
          const dsa = overviewRes.data.dsaSubjects || [];
          const rk = overviewRes.data.rkSubjects || [];
          setCoreSubjects(core);
          setDsaSubjects(dsa);
          setRkSubjects(rk);
          const first = activeGroup === "core" ? core[0] : activeGroup === "rk" ? rk[0] : dsa[0];
          setActiveSubjectId(first?.id || "");
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete roadmap");
    }
  };

  const handleTopicAction = (e) => {
    if (isCurrentLocked) {
      e.preventDefault();
      toast.error("🔒 RK WORKSPACE lessons are exclusive to RK Coaching Classes students.");
      setIsVerificationModalOpen(true);
    }
  };

  if (loading) {
    return <Loader text="Loading Workspace..." subtitle="Gathering curriculum syllabi." fullscreen />;
  }

  const isPracticeEligible =
    (activeGroup === "dsa" ||
      activeSubjectId === "sql" ||
      Boolean(currentSubject?.sheetId)) &&
    Boolean(subjectDetails?.modules && subjectDetails.modules.length > 0);

  return (
    <AppShell title="Workspace" showBack={false}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-7">
        {/* Header & Main Navigation Tabs */}
        <section className="pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-800/80 pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <SidebarTrigger />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Workspace
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Top Level Group Tabs: CORE CS, DSA, and RK WORKSPACE */}
            <div className="inline-flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800/90 gap-1 select-none">
              {coreSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleGroupChange("core")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeGroup === "core"
                      ? "bg-[#BA3C3C] text-white shadow-md shadow-red-500/20"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>CORE CS</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      activeGroup === "core"
                        ? "bg-black/30 text-white"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {coreSubjects.length}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleGroupChange("dsa")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeGroup === "dsa"
                    ? "bg-[#BA3C3C] text-white shadow-md shadow-red-500/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>DSA</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    activeGroup === "dsa"
                      ? "bg-black/30 text-white"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {dsaSubjects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGroupChange("rk")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeGroup === "rk"
                    ? "bg-[#BA3C3C] text-white shadow-md shadow-red-500/20"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>RK WORKSPACE</span>
                {!user?.isRkStudent ? (
                  user?.rkStatus === "pending" ? (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVerificationModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer"
                      title="Verification In Review (Click to view)"
                    >
                      <span className="animate-pulse text-[10px]">⏳</span>
                      <span>{rkSubjects.length}</span>
                    </span>
                  ) : (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVerificationModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-pointer"
                      title="Locked for RK Coaching students"
                    >
                      <Lock className="w-3 h-3 shrink-0" strokeWidth={1.8} />
                      <span>{rkSubjects.length}</span>
                    </span>
                  )
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/30 text-white"
                    title="Verified RK Coaching Scholar (Unlocked)"
                  >
                    <span>🎓</span>
                    <span>{rkSubjects.length}</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Section Sub-header: Group Title on Left + Carousel Arrows on Right */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {activeGroup === "dsa"
                ? "DSA sheets"
                : activeGroup === "core"
                ? "Core CS roadmaps"
                : "RK Coaching materials"}
            </h2>

            {/* Carousel Navigation Arrows */}
            {(canScrollLeft || canScrollRight) && (
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  disabled={!canScrollLeft}
                  className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-red-500/40 flex items-center justify-center transition disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  title="Scroll Left"
                  aria-label="Previous roadmaps"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  disabled={!canScrollRight}
                  className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-red-500/40 flex items-center justify-center transition disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  title="Scroll Right"
                  aria-label="Next roadmaps"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Selected Group Subject Cards (compact & balanced proportions) */}
          <div
            ref={carouselRef}
            style={maskStyle}
            className={`flex gap-3.5 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              currentList.length <= 4
                ? "flex-wrap overflow-visible [mask-image:none]"
                : ""
            }`}
          >
            {currentList.map((sub) => {
              const isActive = activeSubjectId === sub.id;
              const Icon =
                SUBJECT_ICONS[sub.id] ||
                (sub.group === "rk"
                  ? GraduationCap
                  : sub.group === "core"
                  ? Cpu
                  : Code2);

              return (
                <div
                  key={sub.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveSubjectId(sub.id)}
                  onKeyDown={(e) => e.key === "Enter" && setActiveSubjectId(sub.id)}
                  className={`relative overflow-hidden p-4 sm:p-4.5 rounded-xl cursor-pointer select-none transition-all duration-200 group flex flex-col justify-between shrink-0 snap-start w-full sm:w-[280px] lg:w-[290px] xl:w-[300px] ${
                    isActive
                      ? "bg-[var(--surface-card)] border-2 border-red-500 shadow-md ring-2 ring-red-500/20"
                      : "bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-red-500/40 hover:bg-[var(--surface-hover)] shadow-xs"
                  }`}
                >
                  <div>
                    {/* Top Row: Icon on Left, Big Topic Count on Right */}
                    <div className="flex items-start justify-between mb-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isActive
                            ? "bg-red-500/15 border border-red-500/35 text-red-500"
                            : "bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-theme-muted group-hover:text-red-500"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-xl font-bold font-mono tracking-tight leading-none ${
                            isActive ? "text-red-600 dark:text-red-400" : "text-theme-main"
                          }`}
                        >
                          {sub.topicsCount}
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-theme-muted block mt-0.5">
                          {sub.topicsCount} TOPICS
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold tracking-tight text-theme-main group-hover:text-red-500 transition-colors truncate">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-theme-muted group-hover:text-theme-main transition-colors mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                      {sub.description}
                    </p>
                  </div>

                  {/* Bottom Row: Modules Count & Active / Explore Badge */}
                  <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-theme-muted transition-colors flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-theme-muted group-hover:text-red-500 transition-colors" />
                      {sub.modulesCount} modules
                    </span>

                    {sub.group === "rk" && !user?.isRkStudent ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVerificationModalOpen(true);
                        }}
                        className="text-theme-muted hover:text-theme-main transition-colors flex items-center cursor-pointer"
                        title="Locked for RK Coaching students"
                      >
                        <Lock className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </span>
                    ) : isActive ? (
                      <span className="text-black font-bold text-[10px] bg-[#d4e976] px-2 py-0.5 rounded-full font-mono shadow-sm">
                        Active
                      </span>
                    ) : (
                      <span className="text-theme-muted group-hover:text-theme-main font-mono text-[11px] flex items-center gap-1 transition-colors">
                        Explore →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Syllabus Explorer (Active Roadmap Detail Box) */}
        <section className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xs space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-center">
            {/* Left Column: Title, Description, and Badges */}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold text-theme-main tracking-tight">
                  {subjectDetails?.title || currentSubject?.title || "Syllabus Details"}
                </h2>
                {currentSubject?.lastSyncedAt && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Synced {new Date(currentSubject.lastSyncedAt).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-theme-muted mt-2 mb-4 leading-relaxed">
                {activeGroup === "core"
                  ? "Comprehensive curriculum extracted directly from core computer science university & interview syllabi."
                  : activeGroup === "dsa"
                  ? "Curated problem roadmap mapped with solution approaches, complexities, and code templates."
                  : "Classroom study materials, offline tests, and exclusive problem sets for RK Coaching Classes."}
              </p>

              {/* Badges: Modules and Lessons */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-theme-muted">
                  {subjectDetails?.totalModules || 0} modules
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-theme-muted">
                  {subjectDetails?.totalItems || 0} lessons
                </span>
              </div>
            </div>

            {/* Right Column: Practice in Interactive Studio Box */}
            {isPracticeEligible && (
              <div className="relative overflow-hidden p-5 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border-subtle)] shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-theme-main">
                  <Code2 className="w-4 h-4 text-red-500" />
                  <span>Practice in the Interactive Studio</span>
                </div>
                <p className="text-[11px] text-theme-muted leading-relaxed">
                  3-tier solutions, 1-click judge forwarding, and mastery tracking for every problem.
                </p>
                <button
                  type="button"
                  onClick={handleOpenInStudio}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#BA3C3C] hover:bg-[#e53935] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isCurrentLocked && <Lock className="w-3.5 h-3.5" />}
                  <span>{isCurrentLocked ? "Unlock RK WORKSPACE to Practice" : "Add & Open in Studio →"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Modules Sub-Section Header */}
          <div className="flex items-center justify-between border-t border-neutral-800/60 pt-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              Modules
            </h3>
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
              {subjectDetails?.totalModules || 0} MODULES • {subjectDetails?.totalItems || 0} LESSONS
            </span>
          </div>

          {/* Modules Accordion List */}
          {detailsLoading ? (
            <div className="py-16 text-center text-xs text-neutral-500">
              Loading syllabus topics...
            </div>
          ) : subjectDetails?.modules && subjectDetails.modules.length > 0 ? (
            <div className="space-y-2.5">
              {subjectDetails.modules.map((mod, idx) => {
                const isExpanded = expandedModuleId === mod.moduleId;
                const itemsCount = mod.items ? mod.items.length : 0;

                return (
                  <div
                    key={mod.moduleId || idx}
                    className="border border-neutral-800/80 rounded-xl overflow-hidden bg-[#0d090c] hover:border-neutral-700 transition-all duration-200"
                  >
                    {/* Module Header Toggle */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleModule(mod.moduleId)}
                      onKeyDown={(e) => e.key === "Enter" && toggleModule(mod.moduleId)}
                      className="px-4 py-3 flex items-center justify-between hover:bg-neutral-900/40 transition cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center gap-1.5">
                          {isCurrentLocked && (
                            <Lock className="w-3 h-3 text-neutral-400 shrink-0" strokeWidth={1.8} />
                          )}
                          Module {idx + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-neutral-200">
                          {mod.moduleTitle}
                        </h4>
                      </div>

                      <div className="flex items-center gap-3 text-neutral-400 text-xs">
                        {isCurrentLocked && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsVerificationModalOpen(true);
                            }}
                            className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                            title="Locked for RK Coaching students"
                          >
                            <Lock className="w-3.5 h-3.5" strokeWidth={1.8} />
                          </span>
                        )}
                        <span className="text-[11px] font-mono">{itemsCount} topics</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                    </div>

                    {/* Topics Sub-list */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 border-t border-neutral-800/60 divide-y divide-neutral-800/40">
                        {mod.items && mod.items.length > 0 ? (
                          mod.items.map((item) => {
                            const judgeUrl = item.platformUrl || item.leetcodeUrl;
                            const judgeName =
                              item.platform ||
                              (judgeUrl?.includes("codeforces.com")
                                ? "Codeforces"
                                : "LeetCode");

                            return (
                              <div
                                key={item.id}
                                className="py-2.5 flex items-center justify-between text-xs hover:bg-neutral-900/40 px-2 rounded-lg transition gap-2"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                  <span className="text-neutral-200 font-medium truncate">
                                    {item.title}
                                  </span>
                                  {item.leetcodeDifficulty && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                                        item.leetcodeDifficulty === "Easy"
                                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                          : item.leetcodeDifficulty === "Hard"
                                          ? "bg-rose-500/15 text-rose-400 border-rose-500/25"
                                          : "bg-amber-500/15 text-amber-400 border-amber-500/25"
                                      }`}
                                    >
                                      {item.leetcodeDifficulty}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  {judgeUrl && (
                                    <a
                                      href={judgeUrl}
                                      target={!isCurrentLocked ? "_blank" : "_self"}
                                      rel="noreferrer"
                                      onClick={handleTopicAction}
                                      className="text-neutral-400 hover:text-white transition flex items-center gap-1 text-[11px] font-mono"
                                      title={!isCurrentLocked ? `Open problem on ${judgeName}` : "Locked for RK Coaching students"}
                                    >
                                      {isCurrentLocked && (
                                        <Lock className="w-2.5 h-2.5 text-neutral-400 shrink-0" strokeWidth={1.8} />
                                      )}
                                      <span>{judgeName}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}

                                  {item.tufHref && (
                                    <a
                                      href={item.tufHref}
                                      target={!isCurrentLocked ? "_blank" : "_self"}
                                      rel="noreferrer"
                                      onClick={handleTopicAction}
                                      className="text-neutral-400 hover:text-white transition flex items-center gap-1 text-[11px] font-mono"
                                      title={!isCurrentLocked ? "Open on TUF" : "Locked for RK Coaching students"}
                                    >
                                      {isCurrentLocked && (
                                        <Lock className="w-2.5 h-2.5 text-neutral-400 shrink-0" strokeWidth={1.8} />
                                      )}
                                      <span>TUF</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}

                                  {item.lessonUrl && (
                                    <a
                                      href={item.lessonUrl}
                                      target={!isCurrentLocked ? "_blank" : "_self"}
                                      rel="noreferrer"
                                      onClick={handleTopicAction}
                                      className="text-neutral-400 hover:text-white transition flex items-center gap-1 text-[11px] font-mono"
                                      title={!isCurrentLocked ? "View lesson" : "Locked for RK Coaching students"}
                                    >
                                      {isCurrentLocked && (
                                        <Lock className="w-2.5 h-2.5 text-neutral-400 shrink-0" strokeWidth={1.8} />
                                      )}
                                      <span>View Lesson</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="py-2 text-xs text-neutral-500">
                            No topics listed for this module.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 px-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-neutral-800 bg-slate-50/70 dark:bg-[#0E0C16]/50">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 mx-auto flex items-center justify-center mb-3">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                {activeGroup === "rk" ? "RK Workspace Playlists & Courses" : "No Content Available"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                {activeGroup === "rk"
                  ? "YouTube playlists, classroom lectures, and learning roadmaps published by developer/admin will be displayed here."
                  : "No syllabus topics found for this selection."}
              </p>
            </div>
          )}
        </section>

        {/* Verification Modal for Students */}
        <RkVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          initialPasskey={initialPasskey}
        />
      </div>
    </AppShell>
  );
}
