import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Code2,
  ExternalLink,
  BookOpen,
  Search,
  CheckCircle2,
  Circle,
  ChevronDown,
  Layers,
  Plus,
  Trash2,
  X,
  FileCode2,
  RefreshCw,
  Key,
  Link2,
  ShieldCheck,
  User,
  Download,
} from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import AppShell from "../components/layout/AppShell";
import Loader from "../components/common/Loader";
import StufuModal from "../components/practice/StufuModal";
import CustomImportModal, { CustomImportForm } from "../components/modals/CustomImportModal";
import { useAuth } from "../context/AuthContext";


const DIFF_BADGES = {
  Easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Hard: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

const getJudgePlatformName = (url = "", platform = "") => {
  if (platform && !["problem link", "official platform"].includes(platform.toLowerCase())) return platform;
  const u = (url || "").toLowerCase();
  if (u.includes("codeforces.com")) return "Codeforces";
  if (u.includes("geeksforgeeks.org")) return "GFG";
  if (u.includes("codechef.com")) return "CodeChef";
  if (u.includes("hackerrank.com")) return "HackerRank";
  if (u.includes("atcoder.jp")) return "AtCoder";
  if (u.includes("takeuforward.org")) return "TUF";
  if (u.includes("leetcode.com")) return "LeetCode";
  return platform || "Judge";
};

function SyncSheetModal({ isOpen, sheet, onClose, onSync, loading }) {
  const [sheetUrl, setSheetUrl] = useState(sheet?.sourceUrl || "");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("sb_gemini_api_key") || "");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (sheet) {
      setSheetUrl(sheet.sourceUrl || "");
    }
  }, [sheet]);

  if (!isOpen || !sheet) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sheetUrl.trim()) {
      return toast.error("Please enter a Google Sheets, Google Drive, or Excel link to sync");
    }
    if (apiKey.trim()) {
      localStorage.setItem("sb_gemini_api_key", apiKey.trim());
    }
    onSync(sheet.id, sheetUrl.trim(), apiKey.trim());
  };

  const isOfficial = sheet.isOfficial || sheet.uploadedBy === "Developer / Admin";

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-[#121214] border border-neutral-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-neutral-100 truncate">
                Sync {sheet.title}
              </h3>
              {!isOfficial && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span>Personal</span>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              {isOfficial
                ? "Syncing will update this roadmap with your Google Sheets or Drive link for all students across the platform."
                : "Keep this roadmap synchronized with your latest cloud spreadsheet updates."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center justify-between">
              <span>Google Sheet / Drive / Excel Link</span>
              <span className="text-[10px] text-neutral-500 font-mono">Live Sync</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Link2 className="w-4 h-4 text-red-400" />
              </div>
              <input
                type="url"
                required
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="Paste Google Sheets, Google Drive, or Excel link..."
                className="w-full bg-[#0E0E12] border border-neutral-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 font-sans transition"
              />
            </div>
            {sheet.lastSyncedAt && (
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                Last synced: {new Date(sheet.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowKey((prev) => !prev)}
              className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Key className="w-3 h-3 text-neutral-400" />
              <span>{showKey ? "Hide Gemini API Key" : "Custom Gemini API Key (optional)"}</span>
            </button>

            {showKey && (
              <div className="mt-2 space-y-1">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank to use server .env key)"
                  className="w-full bg-[#0E0E12] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-red-500 font-mono"
                />
                <p className="text-[10px] text-neutral-500">
                  Uses server <code className="text-red-400">GEMINI_API_KEY</code> by default.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 text-xs font-medium hover:bg-neutral-800 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !sheetUrl.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing Sheet...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Roadmap Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function Practice() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [activeSheetId, setActiveSheetId] = useState("");
  const [sheetDetails, setSheetDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Zero-state tab & custom modal
  const [zeroTab, setZeroTab] = useState("roadmap"); // "roadmap" | "custom"
  const [zeroDropdownOpen, setZeroDropdownOpen] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customImporting, setCustomImporting] = useState(false);

  // Sync Sheet modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncTargetSheet, setSyncTargetSheet] = useState(null);

  // Stufu Modal State
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isStufuOpen, setIsStufuOpen] = useState(false);
  const [stufuShowSolution, setStufuShowSolution] = useState(false);

  const dropdownRef = useRef(null);
  const zeroDropdownRef = useRef(null);

  const [searchParams] = useSearchParams();
  const urlSheetId = searchParams.get("sheet");
  const urlAction = searchParams.get("action");

  // 1. Fetch available & enrolled sheets
  const fetchSheets = useCallback(async (preferredSheetId = null) => {
    try {
      setLoading(true);
      const res = await api.get("/practice/sheets");
      if (res.data.success) {
        const enrolled = res.data.sheets || [];
        const allCatalog = res.data.catalog || [];
        setSheets(enrolled);
        setCatalog(allCatalog);

        // Determine which sheet should be active
        if (preferredSheetId && enrolled.some((s) => s.id === preferredSheetId)) {
          setActiveSheetId(preferredSheetId);
        } else if (preferredSheetId && allCatalog.some((s) => s.id === preferredSheetId)) {
          try {
            await api.post("/practice/enroll", { sheetId: preferredSheetId });
            setActiveSheetId(preferredSheetId);
            const refetch = await api.get("/practice/sheets");
            if (refetch.data.success) {
              setSheets(refetch.data.sheets || []);
              setCatalog(refetch.data.catalog || []);
            }
          } catch {
            setActiveSheetId(preferredSheetId);
          }
        } else if (enrolled.length > 0) {
          setActiveSheetId((curr) => {
            return enrolled.some((s) => s.id === curr) ? curr : enrolled[0].id;
          });
        } else {
          setActiveSheetId("");
          setSheetDetails(null);
        }
      }
    } catch (err) {
      console.error("[Practice] Error loading sheets:", err);
      toast.error("Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlAction === "import") {
      setShowCustomModal(true);
    }
    fetchSheets(urlSheetId);
  }, [fetchSheets, urlSheetId, urlAction]);

  // 2. Fetch active sheet details
  const fetchSheetDetails = useCallback(async (sheetId) => {
    if (!sheetId) {
      setSheetDetails(null);
      return;
    }
    try {
      setSheetLoading(true);
      const res = await api.get(`/practice/sheet/${sheetId}`);
      if (res.data.success) {
        setSheetDetails(res.data);
      }
    } catch (err) {
      console.error("[Practice] Error loading sheet details:", err);
    } finally {
      setSheetLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSheetId) {
      fetchSheetDetails(activeSheetId);
    } else {
      setSheetDetails(null);
    }
  }, [activeSheetId, fetchSheetDetails]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
      if (zeroDropdownRef.current && !zeroDropdownRef.current.contains(e.target)) {
        setZeroDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enroll in sheet
  const handleEnroll = async (sheetId) => {
    try {
      setActionLoadingId(sheetId);
      const res = await api.post("/practice/enroll", { sheetId });
      if (res.data.success) {
        toast.success("Enrolled in roadmap!");
        await fetchSheets(sheetId);
        setIsDropdownOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to enroll in roadmap");
    } finally {
      setActionLoadingId(null);
    }
  };

  const [syncingId, setSyncingId] = useState(null);

  // Direct Import Custom Sheet with Gemini 2.5 Scanner or Cloud Link
  const handleCreateCustomSheet = async ({
    title,
    file,
    sheetUrl,
    rawProblems,
    apiKey,
    publishAsDeveloper,
    group,
    category,
  }) => {
    try {
      setCustomImporting(true);
      const payload = { title };
      if (file) {
        payload.fileBase64 = file.base64;
        payload.fileName = file.name;
        payload.mimeType = file.type;
      }
      if (sheetUrl) payload.sheetUrl = sheetUrl;
      if (rawProblems) payload.rawProblems = rawProblems;
      if (apiKey) payload.geminiApiKey = apiKey;
      if (publishAsDeveloper) {
        payload.publishAsDeveloper = true;
        if (group) payload.group = group;
        if (category) payload.category = category;
      }

      const res = await api.post("/practice/custom-sheet", payload);
      if (res.data.success) {
        toast.success(res.data.message || `Roadmap "${title}" created successfully!`);
        setShowCustomModal(false);
        setIsDropdownOpen(false);
        await fetchSheets(res.data.sheetId);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to import custom sheet");
    } finally {
      setCustomImporting(false);
    }
  };

  const handleDeleteSheet = async (sheetId) => {
    if (!window.confirm("Permanently delete this roadmap from the platform?")) return;
    try {
      setActionLoadingId(sheetId);
      const res = await api.delete(`/practice/custom-sheet/${sheetId}`);
      if (res.data.success) {
        toast.success("Roadmap deleted successfully");
        await fetchSheets();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete roadmap");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Re-sync sheet with its cloud source URL (Google Sheet / Google Drive / Excel)
  const handleSyncSheet = async (sheetId, customUrl, customKey) => {
    if (!sheetId) return;
    try {
      setSyncingId(sheetId);
      const activeKey = customKey || localStorage.getItem("sb_gemini_api_key") || "";
      const res = await api.post("/practice/custom-sheet/sync", {
        sheetId,
        sheetUrl: customUrl || undefined,
        geminiApiKey: activeKey.trim() || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message || "Roadmap synchronized with cloud sheet!");
        setShowSyncModal(false);
        await fetchSheets(sheetId);
        await fetchSheetDetails(sheetId);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to sync roadmap with sheet");
    } finally {
      setSyncingId(null);
    }
  };

  // Unenroll / remove sheet
  const handleUnenroll = async (sheetId) => {
    try {
      setActionLoadingId(sheetId);
      const res = await api.post("/practice/unenroll", { sheetId });
      if (res.data.success) {
        toast.success("Roadmap removed");
        const remaining = sheets.filter((s) => s.id !== sheetId);
        const nextActiveId = remaining.length > 0 ? remaining[0].id : null;
        await fetchSheets(nextActiveId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove roadmap");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle problem solved status
  const handleToggleStatus = async (problemKey) => {
    try {
      const res = await api.post("/practice/toggle-status", { problemKey });
      if (res.data.success) {
        const isNowSolved = res.data.isSolved;

        // Update local sheet details state
        setSheetDetails((prev) => {
          if (!prev || !prev.modules) return prev;
          const updatedModules = prev.modules.map((mod) => ({
            ...mod,
            items: mod.items.map((item) =>
              item.key === problemKey || String(item.id) === problemKey
                ? { ...item, isSolved: isNowSolved }
                : item
            ),
          }));
          return { ...prev, modules: updatedModules };
        });

        // Update sheets solved count
        setSheets((prev) =>
          prev.map((s) => {
            if (s.id === activeSheetId) {
              return {
                ...s,
                solved: isNowSolved ? s.solved + 1 : Math.max(0, s.solved - 1),
              };
            }
            return s;
          })
        );
      }
    } catch (err) {
      console.error("Status toggle error:", err);
    }
  };

  // Open In-App Stufu Modal (default to split-screen solution view)
  const openStufu = (problem, showSolution = true) => {
    setSelectedProblem(problem);
    setStufuShowSolution(showSolution);
    setIsStufuOpen(true);
  };

  // Flattened and filtered problems
  const allProblems = useMemo(() => {
    if (!sheetDetails?.modules || !Array.isArray(sheetDetails.modules)) return [];
    const q = searchQuery.trim().toLowerCase();

    return sheetDetails.modules
      .flatMap((mod) => (Array.isArray(mod?.items) ? mod.items : []))
      .filter((item) => {
        if (!item) return false;
        const title = (item.title || "").toLowerCase();
        const modTitle = (item.module || "").toLowerCase();
        if (q && !title.includes(q) && !modTitle.includes(q)) return false;
        const diff = (item.leetcodeDifficulty || "Medium").toUpperCase();
        if (selectedDifficulty !== "ALL" && diff !== selectedDifficulty) return false;
        if (selectedStatus === "SOLVED" && !item.isSolved) return false;
        if (selectedStatus === "PENDING" && item.isSolved) return false;
        return true;
      });
  }, [sheetDetails, searchQuery, selectedDifficulty, selectedStatus]);

  // Overall solved progress for active sheet
  const { totalCount, solvedCount, progressPercent } = useMemo(() => {
    if (!sheetDetails?.modules || !Array.isArray(sheetDetails.modules)) {
      return { totalCount: 0, solvedCount: 0, progressPercent: 0 };
    }
    const items = sheetDetails.modules.flatMap((m) => (Array.isArray(m?.items) ? m.items : []));
    const solved = items.filter((i) => i?.isSolved).length;
    return {
      totalCount: items.length,
      solvedCount: solved,
      progressPercent: items.length > 0 ? Math.round((solved / items.length) * 100) : 0,
    };
  }, [sheetDetails]);

  const currentSheet = Array.isArray(sheets) ? sheets.find((s) => s.id === activeSheetId) : null;

  if (loading) {
    return <Loader text="Loading Practice Studio..." subtitle="Preparing your roadmaps." fullscreen />;
  }

  return (
    <AppShell title="Practice Studio" showBack={false}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-5">
        {/* Top Developer Bar: Title, Sheet Dropdown & Mastery Stats */}
        <section className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-red-500" />
              Practice Studio
            </h1>

            {/* Developer Side Sheet Dropdown: ONLY shown when user has at least 1 enrolled sheet */}
            {sheets.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-neutral-900/60 dark:hover:bg-neutral-800/80 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 text-xs font-medium text-slate-800 dark:text-neutral-200 transition cursor-pointer shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">
                    {currentSheet?.title || "Select Sheet"}
                  </span>
                  {currentSheet && (
                    <span className="text-[11px] font-mono text-red-600 dark:text-red-400 bg-white dark:bg-[#0E0E12] px-1.5 py-0.5 rounded border border-slate-200 dark:border-neutral-800">
                      {currentSheet.solved ?? 0}/{currentSheet.total ?? 0}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Flyout Menu */}
                {isDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-white dark:bg-[#121214] border border-slate-200 dark:border-neutral-800 shadow-xl dark:shadow-2xl p-1.5 z-40 backdrop-blur-md animate-fade-in text-xs space-y-1">
                    {/* Section 1: Enrolled Sheets */}
                    {sheets.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                          My Enrolled Sheets
                        </div>
                        {sheets.map((s) => {
                          const isSelected = s.id === activeSheetId;
                          return (
                            <div
                              key={s.id}
                              className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition group ${
                                isSelected
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400 font-semibold border border-red-500/25"
                                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:text-white"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSheetId(s.id);
                                  setIsDropdownOpen(false);
                                }}
                                className="flex items-center gap-2 flex-1 text-left cursor-pointer truncate"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <span className="truncate">{s.title}</span>
                                {s.isOfficial || s.uploadedBy === "Developer / Admin" ? (
                                  <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/25 text-[9px] font-medium shrink-0 flex items-center gap-0.5">
                                    <ShieldCheck className="w-2.5 h-2.5 text-red-500 dark:text-red-400" />
                                    <span>Dev</span>
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400 text-[9px] font-medium shrink-0">
                                    Personal
                                  </span>
                                )}
                                {s.sourceUrl && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[9px] font-mono shrink-0 flex items-center gap-0.5">
                                    <Link2 className="w-2.5 h-2.5" />
                                    <span>Synced</span>
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-400 shrink-0">
                                  ({s.solved ?? 0}/{s.total ?? 0})
                                </span>
                              </button>

                              <button
                                type="button"
                                title="Remove from practice"
                                disabled={actionLoadingId === s.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnenroll(s.id);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer ml-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Section 2: EXISTING ROADMAP: */}
                    <div className="pt-1 border-t border-slate-200 dark:border-neutral-800 space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-red-500 dark:text-red-400">
                        EXISTING ROADMAP (DEVELOPER):
                      </div>
                      {catalog.map((cat) => {
                        const isEnrolled = sheets.some((s) => s.id === cat.id);
                        if (isEnrolled) return null;
                        return (
                          <div
                            key={cat.id}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-red-600 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:hover:text-red-400 transition group"
                          >
                            <button
                              type="button"
                              disabled={actionLoadingId === cat.id}
                              onClick={() => handleEnroll(cat.id)}
                              className="flex items-center gap-2 truncate flex-1 text-left cursor-pointer disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                              <span className="truncate">{cat.title}</span>
                              {(cat.isOfficial !== false || cat.uploadedBy === "Developer / Admin") && (
                                <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/25 text-[9px] font-medium shrink-0 flex items-center gap-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5 text-red-500 dark:text-red-400" />
                                  <span>Dev</span>
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-400">
                                {cat.total} prob
                              </span>
                              {(cat.isCustom || (user?.role === "admin" && !["strivers-180", "sql-75", "codeforces-ladder", "os", "dbms", "cn", "sql"].includes(cat.id))) && (
                                <button
                                  type="button"
                                  title="Delete roadmap"
                                  disabled={actionLoadingId === cat.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSheet(cat.id);
                                  }}
                                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-neutral-500 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Direct Import Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setShowCustomModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-600 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-neutral-800/60 font-semibold transition text-left cursor-pointer mt-1 border-t border-slate-200 dark:border-neutral-800"
                      >
                        <FileCode2 className="w-3.5 h-3.5" />
                        <span>+ Direct Import Custom Sheet...</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Provenance Badge for Active Sheet */}
            {currentSheet && !currentSheet.isOfficial && currentSheet.uploadedBy !== "Developer / Admin" && (
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-neutral-800/80 text-neutral-300 border border-neutral-700/80 flex items-center gap-1.5 shrink-0">
                <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Personal Sheet</span>
              </span>
            )}

            {/* Sync Sheet Button (Admins can sync any sheet; regular users only sync personal sheets) */}
            {currentSheet && (user?.role === "admin" || (!currentSheet.isOfficial && currentSheet.uploadedBy !== "Developer / Admin")) && (
              <button
                type="button"
                onClick={() => {
                  setSyncTargetSheet(currentSheet);
                  setShowSyncModal(true);
                }}
                disabled={syncingId === currentSheet.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-neutral-900/60 dark:hover:bg-neutral-800/80 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 text-xs font-semibold text-slate-800 dark:text-neutral-200 transition cursor-pointer disabled:opacity-50 shadow-xs"
                title={
                  currentSheet.sourceUrl
                    ? `Synced with ${currentSheet.sourceUrl}`
                    : "Sync roadmap with Google Sheets / Drive / Excel link"
                }
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-red-500 dark:text-red-400 ${syncingId === currentSheet.id ? "animate-spin" : ""}`}
                />
                <span>{syncingId === currentSheet.id ? "Syncing..." : "Sync Sheet"}</span>
                {currentSheet.sourceUrl && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" title="Cloud Synced" />
                )}
              </button>
            )}

          </div>

          {/* Right: Solved Progress & Stats */}
          {Boolean(sheetDetails && Array.isArray(sheetDetails.modules) && totalCount > 0) && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                {solvedCount} / {totalCount} Solved
              </span>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 font-mono">
                {progressPercent}%
              </span>
              <div className="w-24 h-2 rounded-full bg-slate-200 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Clean Extension & Settings Sync Banner Strip (Matching Sub-header layout) */}
        <div className="h-11 bg-white dark:bg-[#121214] border border-slate-200 dark:border-neutral-800 rounded-xl px-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden">
            <Code2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
            <span className="text-xs font-medium text-slate-800 dark:text-neutral-200 truncate">
              Auto-sync coding progress:
            </span>
            <Link
              to="/settings"
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition underline underline-offset-2 font-medium shrink-0 flex items-center gap-1"
            >
              <span>Set handles in Settings</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono hidden md:inline shrink-0">
              (⚠️ Chrome browser required)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={import.meta.env.VITE_CHROME_EXTENSION_URL || "/studybuddy-extension.zip"}
              target={import.meta.env.VITE_CHROME_EXTENSION_URL ? "_blank" : undefined}
              rel={import.meta.env.VITE_CHROME_EXTENSION_URL ? "noreferrer" : undefined}
              download={import.meta.env.VITE_CHROME_EXTENSION_URL ? undefined : "studybuddy-extension.zip"}
              onClick={() => {
                if (!import.meta.env.VITE_CHROME_EXTENSION_URL) {
                  toast.success("StudyBuddy extension package downloaded! 🚀");
                }
              }}
              className="text-xs text-slate-700 hover:text-slate-900 dark:text-neutral-200 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-700/60 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Add StudyBuddy to Chrome"
            >
              {import.meta.env.VITE_CHROME_EXTENSION_URL ? (
                <ExternalLink className="w-3 h-3 text-red-500 dark:text-red-400" />
              ) : (
                <Download className="w-3 h-3 text-red-500 dark:text-red-400" />
              )}
              <span className="font-medium">Add to Chrome</span>
            </a>
          </div>
        </div>

        {/* If user currently has ZERO sheets enrolled */}
        {sheets.length === 0 ? (
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-center max-w-lg mx-auto space-y-5 my-10 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#121214] border border-neutral-800 flex items-center justify-center text-red-400 mx-auto shadow-sm">
              <Code2 className="w-6 h-6 text-red-400" />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-100">
                Select Sheet to Begin Practice
              </h3>
            </div>

            {/* Two clean tabs: Existing Roadmap vs Direct Import */}
            <div className="flex rounded-xl bg-[#0E0E12] p-1 border border-neutral-800">
              <button
                type="button"
                onClick={() => setZeroTab("roadmap")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  zeroTab === "roadmap"
                    ? "bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] text-white shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Existing Roadmap
              </button>
              <button
                type="button"
                onClick={() => setZeroTab("custom")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  zeroTab === "custom"
                    ? "bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] text-white shadow-xs"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Direct Import (Custom)
              </button>
            </div>

            {zeroTab === "roadmap" ? (
              <div className="relative text-left" ref={zeroDropdownRef}>
                <button
                  type="button"
                  onClick={() => setZeroDropdownOpen((prev) => !prev)}
                  className="w-full bg-[#0E0E12] border border-neutral-800 hover:border-neutral-700 text-neutral-100 rounded-xl px-4 py-2.5 text-xs font-mono outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 cursor-pointer shadow-sm transition flex items-center justify-between"
                >
                  <span className="text-neutral-200 font-medium">EXISTING ROADMAP:</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
                      zeroDropdownOpen ? "rotate-180 text-red-400" : ""
                    }`}
                  />
                </button>

                {zeroDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-[#121214] border border-neutral-800 shadow-2xl p-1.5 z-40 backdrop-blur-md animate-fade-in text-xs space-y-1">
                    {catalog.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        disabled={actionLoadingId === cat.id}
                        onClick={() => {
                          setZeroDropdownOpen(false);
                          handleEnroll(cat.id);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-neutral-800/80 hover:text-white transition text-left cursor-pointer group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                          <span className="font-medium text-neutral-200 group-hover:text-red-400 transition-colors truncate">
                            {cat.title}
                          </span>
                          {(cat.isOfficial !== false || cat.uploadedBy === "Developer / Admin") && (
                            <span className="px-1.5 py-0.2 rounded bg-red-500/15 text-red-300 border border-red-500/25 text-[9px] font-medium shrink-0 flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5 text-red-400" />
                              <span>Dev</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-neutral-400 bg-[#0E0E12] px-2 py-0.5 rounded border border-neutral-800 shrink-0">
                          {cat.total} problems
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <CustomImportForm
                onSubmit={handleCreateCustomSheet}
                loading={customImporting}
                isAdmin={user?.role === "admin"}
              />
            )}
          </div>
        ) : (
          <>
            {/* Search & Filter Bar */}
            <section className="bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 dark:text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search problem title or category..."
                    className="w-full bg-slate-50 dark:bg-[#0E0E12] border border-slate-200 dark:border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Difficulty */}
                  <div className="flex items-center rounded-lg bg-slate-100 dark:bg-[#0E0E12] border border-slate-200 dark:border-neutral-800 p-0.5 text-xs">
                    {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                          selectedDifficulty === diff
                            ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-semibold"
                            : "text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                        }`}
                      >
                        {diff === "ALL" ? "All Diff" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>

                  {/* Status */}
                  <div className="flex items-center rounded-lg bg-slate-100 dark:bg-[#0E0E12] border border-slate-200 dark:border-neutral-800 p-0.5 text-xs">
                    {["ALL", "PENDING", "SOLVED"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setSelectedStatus(status)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                          selectedStatus === status
                            ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-semibold"
                            : "text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                        }`}
                      >
                        {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Problem List Table */}
            <section className="bg-white dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
              {sheetLoading ? (
                <div className="py-20 text-center text-xs text-slate-400 dark:text-neutral-500">
                  Loading problem table...
                </div>
              ) : allProblems.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500 dark:text-neutral-400 space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-neutral-200">No problems found</p>
                  <p className="text-slate-400 dark:text-neutral-500">Try adjusting your search query or filter options.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#0E0E12] border-b border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 font-mono text-[11px]">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">Status</th>
                        <th className="py-3 px-3 w-16 text-center">#</th>
                        <th className="py-3 px-4">Problem Title</th>
                        <th className="py-3 px-3 w-28 text-center">Topic</th>
                        <th className="py-3 px-3 w-24 text-center">Difficulty</th>
                        <th className="py-3 px-4 w-52 text-left">Resources</th>
                        <th className="py-3 px-4 text-right w-36">Practice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/60">
                      {allProblems.map((prob, idx) => {
                        const diff = prob.leetcodeDifficulty || "Medium";
                        const solLink = prob.solutionUrl || prob.instructorUrl || "";
                        const judgeLink = prob.platformUrl || prob.leetcodeUrl || "";
                        const isJudgeAnInstructorLink =
                          /drive\.google\.com|docs\.google\.com|youtube\.com|youtu\.be|notion\.|dropbox\.com|pastebin\.com|hastebin\.com|ghostbin\.com|rentry\.co|loom\.com/i.test(judgeLink) ||
                          prob.platform === "Instructor Notes";
                        const hasOfficialJudgeLink = Boolean(judgeLink && !isJudgeAnInstructorLink && judgeLink !== solLink);
                        const hasInstructorSol = Boolean(solLink);

                        return (
                          <tr
                            key={`${prob.id || prob.key || "prob"}-${idx}`}
                            className={`hover:bg-slate-50/80 dark:hover:bg-neutral-800/30 transition group ${
                              prob.isSolved ? "bg-red-50/60 dark:bg-red-950/10" : ""
                            }`}
                          >
                            {/* Status Checkbox */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(prob.key || String(prob.id))}
                                className="text-slate-400 hover:text-emerald-500 dark:text-neutral-500 dark:hover:text-emerald-400 transition cursor-pointer"
                                title={prob.isSolved ? "Mark as pending" : "Mark as solved"}
                              >
                                {prob.isSolved ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 fill-emerald-500/20" />
                                ) : (
                                  <Circle className="w-4 h-4 text-slate-300 dark:text-neutral-600 hover:text-slate-500 dark:hover:text-neutral-400" />
                                )}
                              </button>
                            </td>

                            {/* ID */}
                            <td className="py-3 px-3 font-mono text-slate-500 dark:text-neutral-400 text-[11px] text-center">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800/80 text-slate-600 dark:text-neutral-400 font-mono">
                                #{prob.leetcodeId || prob.id}
                              </span>
                            </td>

                            {/* Title */}
                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-neutral-100">
                              <span
                                onClick={() => openStufu(prob, false)}
                                className="hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer text-xs sm:text-sm line-clamp-1"
                                title={prob.title}
                              >
                                {prob.title}
                              </span>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-3 text-center">
                              <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-800 font-medium truncate max-w-[120px]">
                                {prob.module || "General"}
                              </span>
                            </td>

                            {/* Color-Coded Difficulty Tag */}
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                                  DIFF_BADGES[diff] || DIFF_BADGES.Medium
                                }`}
                              >
                                {diff}
                              </span>
                            </td>

                            {/* Resources Column (LeetCode / Codeforces / GFG + Instructor Solution) */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {hasOfficialJudgeLink && (
                                  <a
                                    href={judgeLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white transition inline-flex items-center gap-1 text-[11px] font-medium"
                                    title={`Open official problem on ${getJudgePlatformName(judgeLink, prob.platform)}`}
                                  >
                                    <span>{getJudgePlatformName(judgeLink, prob.platform)}</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-slate-400 dark:text-neutral-400" />
                                  </a>
                                )}

                                {hasInstructorSol && (
                                  <a
                                    href={solLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-0.5 rounded-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-100 transition inline-flex items-center gap-1 text-[11px] font-medium"
                                    title="Open instructor's provided solution / notes / video"
                                  >
                                    <span>Instructor Sol</span>
                                    <ExternalLink className="w-2.5 h-2.5 text-purple-500 dark:text-purple-400" />
                                  </a>
                                )}

                                {!hasOfficialJudgeLink && !hasInstructorSol && (
                                  <span className="text-slate-300 dark:text-neutral-700 font-mono text-xs pl-1">—</span>
                                )}
                              </div>
                            </td>

                            {/* Practice Studio Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openStufu(prob, true)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 text-slate-700 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white transition flex items-center gap-1 text-[11px] cursor-pointer"
                                  title="View Intuition, Editorial & Code Solution"
                                >
                                  <BookOpen className="w-3 h-3 text-red-500 dark:text-red-400" />
                                  <span>Solution</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openStufu(prob, true)}
                                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white font-semibold transition flex items-center gap-1 text-[11px] cursor-pointer shadow-xs"
                                  title="Open in split-screen StudyBuddy studio"
                                >
                                  <Code2 className="w-3 h-3" />
                                  <span>Code</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Direct Import Custom Sheet Modal */}
      <CustomImportModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSuccess={(newSheetId) => {
          fetchSheets(newSheetId);
        }}
        isAdmin={user?.role === "admin"}
      />

      {/* Sync Sheet Modal for Existing and Personal Roadmaps */}
      {showSyncModal && (
        <SyncSheetModal
          isOpen={showSyncModal}
          sheet={syncTargetSheet || currentSheet}
          onClose={() => setShowSyncModal(false)}
          onSync={handleSyncSheet}
          loading={Boolean(syncingId)}
        />
      )}

      {/* In-App Stufu Split-Screen Studio Modal */}
      {isStufuOpen && selectedProblem && (
        <StufuModal
          isOpen={isStufuOpen}
          onClose={() => {
            setIsStufuOpen(false);
            setSelectedProblem(null);
          }}
          problem={selectedProblem}
          initialShowSolution={stufuShowSolution}
          onProblemSolved={(probKey) => {
            setSheetDetails((prev) => {
              if (!prev || !prev.modules || !Array.isArray(prev.modules)) return prev;
              return {
                ...prev,
                modules: prev.modules.map((mod) => ({
                  ...mod,
                  items: (mod.items || []).map((item) =>
                    item.key === probKey || String(item.id) === probKey
                      ? { ...item, isSolved: true }
                      : item
                  ),
                })),
              };
            });
          }}
        />
      )}
    </AppShell>
  );
}
