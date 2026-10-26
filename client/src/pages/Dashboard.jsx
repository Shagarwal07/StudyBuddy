import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ListMusic,
  Code2,
  Flame,
  Clock,
  ArrowRight,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import Loader from "../components/common/Loader";
import CreatePlaylistModal from "../components/modals/CreatePlaylistModal";
import useImportPlaylist from "../hooks/useImportPlaylist";
import formatTime from "../utils/formatTime";
import Heatmap from "../components/playlist/Heatmap";
import StreakShieldBadge from "../components/dashboard/StreakShieldBadge";
import { useAuth } from "../context/AuthContext";
import Cutout from "../components/web/Cutout";
import StrandDivider from "../components/web/StrandDivider";
import AnimatedStatNumber from "../components/web/AnimatedStatNumber";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";

export default function Dashboard() {
  const { user, setStreak } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [continueData, setContinueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [dashboardRes, streakRes, continueRes] = await Promise.allSettled([
        api.get("/dashboard"),
        api.get("/streak"),
        api.get("/dashboard/continue"),
      ]);

      if (dashboardRes.status === "fulfilled") {
        setDashboardData(dashboardRes.value.data);
      } else {
        throw new Error("Core dashboard data rejected");
      }

      if (streakRes.status === "fulfilled") {
        setStreakData(streakRes.value.data);
        if (typeof streakRes.value.data?.currentStreak === "number") {
          setStreak?.(streakRes.value.data.currentStreak);
        }
      }

      if (
        continueRes.status === "fulfilled" &&
        continueRes.value.data?.video &&
        continueRes.value.data?.playlist
      ) {
        setContinueData(continueRes.value.data);
      } else {
        setContinueData(null);
      }

      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [setStreak]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const {
    importing,
    showModal,
    openModal,
    closeModal: closeImportModal,
    handleImport,
  } = useImportPlaylist(
    useCallback(() => fetchData(), [fetchData]),
    "/youtube",
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const totalMinutes = useMemo(() => {
    return streakData?.totalMinutesStudied || 0;
  }, [streakData]);

  const totalProblemsSolved = useMemo(() => {
    return streakData?.totalProblemsSolved || 0;
  }, [streakData]);

  // Gamified XP & Level derived strictly from real user metrics with progressive level scaling
  const xpInfo = useMemo(() => {
    const problems = totalProblemsSolved;
    const minutes = totalMinutes;
    const completedVideos = dashboardData?.stats?.completedVideos || 0;

    // Real dynamic formula: 50 XP per problem + 30 XP per completed video + 2 XP per minute studied
    const totalXp = problems * 50 + completedVideos * 30 + minutes * 2;

    // Progressive level brackets (higher levels require progressively more XP)
    // Universal learning & mastery titles suitable for all study subjects
    const LEVEL_CURVE = [
      { level: 1, xpNeeded: 800, title: "Novice Scholar" },
      { level: 2, xpNeeded: 1000, title: "Curious Explorer" },
      { level: 3, xpNeeded: 1200, title: "Knowledge Seeker" },
      { level: 4, xpNeeded: 1400, title: "Dedicated Learner" },
      { level: 5, xpNeeded: 1600, title: "Focus Specialist" },
      { level: 6, xpNeeded: 2000, title: "Mastery Scholar" },
      { level: 7, xpNeeded: 3000, title: "Elite Scholar" },
      { level: 8, xpNeeded: 3500, title: "Distinguished Fellow" },
      { level: 9, xpNeeded: 4500, title: "Grand Academic" },
      { level: 10, xpNeeded: 6000, title: "Grandmaster" },
    ];

    let remainingXp = totalXp;
    let currentLevel = 1;
    let maxLevelXp = 800;
    let levelTitle = "Novice Scholar";

    for (const tier of LEVEL_CURVE) {
      if (remainingXp < tier.xpNeeded) {
        currentLevel = tier.level;
        maxLevelXp = tier.xpNeeded;
        levelTitle = tier.title;
        break;
      }
      remainingXp -= tier.xpNeeded;
      currentLevel = tier.level + 1;
      maxLevelXp = tier.xpNeeded + 1000;
      levelTitle = tier.title;
    }

    return {
      level: currentLevel,
      currentXp: remainingXp,
      maxLevelXp,
      title: user?.badge || levelTitle,
      totalXp,
    };
  }, [totalProblemsSolved, totalMinutes, dashboardData?.stats?.completedVideos, user?.badge]);

  const stats = useMemo(() => {
    const totalPlaylists = dashboardData?.stats?.totalPlaylists ?? 0;
    const completedVideos = dashboardData?.stats?.completedVideos ?? 0;

    return [
      {
        title: "CURRENT STREAK",
        value: `${streakData?.currentStreak ?? 0} days`,
        sub: `Best: ${streakData?.longestStreak ?? streakData?.currentStreak ?? 0}d`,
        icon: Flame,
        color: "text-orange-400",
        bg: "bg-red-500/10 border-red-500/30",
      },
      {
        title: "PROBLEMS SOLVED",
        value: totalProblemsSolved,
        sub: "DSA & Coding",
        icon: Code2,
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/30",
      },
      {
        title: "STUDY TIME",
        value:
          totalMinutes >= 60
            ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
            : `${totalMinutes}m`,
        sub: `${completedVideos} videos completed`,
        icon: Clock,
        color: "text-neutral-300",
        bg: "bg-neutral-900 border-neutral-800",
      },
      {
        title: "PLAYLISTS TRACKED",
        value: totalPlaylists,
        sub: "Ad-free Video",
        icon: ListMusic,
        color: "text-red-400",
        bg: "bg-red-500/10 border-red-500/30",
      },
    ];
  }, [dashboardData, streakData, totalProblemsSolved, totalMinutes]);

  // Other user courses in progress from real recent playlists
  const otherCourses = useMemo(() => {
    const list = dashboardData?.recentPlaylists || [];
    const currentId = continueData?.playlist?._id;
    return list.filter((p) => String(p._id) !== String(currentId)).slice(0, 4);
  }, [dashboardData?.recentPlaylists, continueData?.playlist?._id]);

  const matchedRecent = useMemo(() => {
    const currentId = continueData?.playlist?._id;
    if (!currentId || !dashboardData?.recentPlaylists) return null;
    return dashboardData.recentPlaylists.find(
      (p) => String(p._id) === String(currentId)
    );
  }, [continueData?.playlist?._id, dashboardData?.recentPlaylists]);

  if (loading) {
    return (
      <Loader
        text="Loading Dashboard..."
        subtitle="Preparing your learning insights."
        fullscreen
      />
    );
  }

  if (error) {
    return (
      <AppShell title="Dashboard" showBack={false}>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-neutral-100 mb-2">
            Failed to load dashboard
          </h2>
          <p className="text-xs text-neutral-400 max-w-sm mb-6">
            We couldn't connect to the StudyBuddy API server. Please check your network or try again.
          </p>
          <button
            type="button"
            onClick={fetchData}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition cursor-pointer border border-neutral-700"
          >
            Try Again
          </button>
        </div>
      </AppShell>
    );
  }

  const featuredVideo = continueData?.video;
  const featuredPlaylist = continueData?.playlist;

  const featuredProgressPercent = featuredVideo
    ? typeof featuredVideo.progressPercent === "number"
      ? featuredVideo.progressPercent
      : featuredVideo.durationInSeconds > 0
      ? Math.round(((featuredVideo.watchedSeconds || 0) / featuredVideo.durationInSeconds) * 100)
      : 0
    : 0;

  const featuredCompletedVideos =
    featuredPlaylist?.completedVideos ??
    matchedRecent?.completedVideos ??
    (featuredVideo?.completed ? 1 : 0);

  const featuredTotalVideos =
    featuredPlaylist?.totalVideos ??
    matchedRecent?.totalVideos ??
    1;

  const courseProgressPercent =
    typeof featuredPlaylist?.progress === "number" && featuredPlaylist.progress > 0
      ? featuredPlaylist.progress
      : featuredTotalVideos > 0
      ? Math.round((featuredCompletedVideos / featuredTotalVideos) * 100)
      : 0;

  const remainingHours = featuredPlaylist?.remainingHours
    ? `${featuredPlaylist.remainingHours} hrs left`
    : matchedRecent?.remainingHours
    ? `${matchedRecent.remainingHours} hrs left`
    : featuredPlaylist?.totalDurationInSeconds
    ? `${(Math.max(0, featuredPlaylist.totalDurationInSeconds - (featuredPlaylist.watchedSeconds || 0)) / 3600).toFixed(1)} hrs left`
    : null;

  return (
    <AppShell title="Dashboard" showBack={false}>
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
        {/* Dynamic Welcome Header with Real User Name & Level */}
        <section className="pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-theme-muted">
              {greeting.toUpperCase()},
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-red-600 dark:text-red-400 flex items-center gap-2">
              {user?.name || user?.username || "Learner"}
            </h1>

            {/* Level & Dynamic XP Strip */}
            <div className="pt-1.5 flex flex-wrap items-center gap-2.5 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 dark:bg-red-950/70 border border-red-500/30 dark:border-red-500/40 text-red-600 dark:text-red-400 font-mono font-bold text-[10px] tracking-wider">
                LVL {xpInfo.level}
              </span>
              <span className="font-semibold text-theme-main text-xs">
                {xpInfo.title}
              </span>
              <span className="text-[11px] font-mono text-theme-muted">
                {xpInfo.currentXp.toLocaleString()} / {xpInfo.maxLevelXp.toLocaleString()} XP
              </span>
            </div>

            {/* Glowing Red XP Bar */}
            <div className="w-full max-w-sm h-1.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border-subtle)] overflow-hidden mt-1 shadow-inner">
              <div
                className="h-full bg-red-600 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((xpInfo.currentXp / xpInfo.maxLevelXp) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => navigate("/youtube")}
              className="px-4 py-2.5 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] hover:border-red-500/40 text-theme-main text-xs font-semibold flex items-center gap-2 cursor-pointer transition shadow-xs group active:scale-[0.98]"
              title="Start Learning"
            >
              <Play className="w-3.5 h-3.5 text-red-500 fill-red-500/30" />
              <span>Start Learning</span>
              <ArrowRight className="w-3.5 h-3.5 text-theme-muted group-hover:text-theme-main group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </section>

        {/* Ambient Strand Divider */}
        <StrandDivider className="my-1" />

        {/* 4 Cutout Stat Cards (Current Streak, Problems Solved, Study Time, Playlists Tracked) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const cutVariant = idx % 2 === 0 ? "card-tr" : "card-bl";

            return (
              <Cutout
                key={stat.title}
                variant={cutVariant}
                className="w-full"
                innerClassName="p-4 sm:p-5 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-theme-muted truncate">
                    {stat.title}
                  </p>
                  <div className="mt-1 text-xl sm:text-2xl font-extrabold text-theme-main tracking-tight">
                    <AnimatedStatNumber value={stat.value} />
                  </div>
                  <p className="text-[10px] font-mono text-theme-muted mt-1 truncate">
                    {stat.sub}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 border rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.color} shadow-sm`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </Cutout>
            );
          })}
        </section>

        {/* Split Cards: Dedicated Activity Heatmap Card + Dedicated Streak Shield Badge Card */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 sm:gap-5 items-stretch">
          <div className="min-w-0 h-full">
            <Heatmap heatmap={streakData?.heatmap || {}} />
          </div>

          <div className="min-w-0 h-full">
            <Cutout
              variant="card-bl"
              className="w-full h-full min-h-[220px]"
              innerClassName="p-5 flex flex-col items-center justify-center h-full relative overflow-hidden"
            >
              <StreakShieldBadge
                currentStreak={streakData?.currentStreak ?? 0}
                longestStreak={streakData?.longestStreak ?? 0}
              />
            </Cutout>
          </div>
        </section>

        {/* Continue Learning Card Container */}
        <section>
          <Cutout
            variant="card"
            className="w-full"
            innerClassName="p-5 sm:p-6 flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                <h2 className="text-base sm:text-lg font-bold text-theme-main tracking-tight">
                  Continue Learning
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate("/youtube")}
                className="text-xs font-mono text-theme-muted hover:text-red-500 transition cursor-pointer flex items-center gap-1 group"
              >
                <span>All in Ad-free Video</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {featuredVideo && featuredPlaylist ? (
              <div className="space-y-6">
                {/* Main Featured Video Item - Responsive side-by-side on tablet & desktop */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-5">
                  {/* Thumbnail Card with Center Play Button and Bottom Progress Bar */}
                  <div
                    onClick={() =>
                      navigate(
                        `/playlist/${featuredPlaylist._id}/video/${featuredVideo._id}?start=${
                          featuredVideo.watchedSeconds || 0
                        }`
                      )
                    }
                    className="relative w-full md:w-80 lg:w-96 aspect-video rounded-xl overflow-hidden shrink-0 group border border-neutral-800 bg-neutral-950 shadow-md cursor-pointer"
                  >
                    <img
                      src={
                        featuredVideo.thumbnailUrl ||
                        (featuredVideo.ytVideoId
                          ? `https://i.ytimg.com/vi/${featuredVideo.ytVideoId}/hqdefault.jpg`
                          : FALLBACK_THUMBNAIL)
                      }
                      alt={featuredVideo.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          featuredVideo.ytVideoId
                            ? `https://i.ytimg.com/vi/${featuredVideo.ytVideoId}/hqdefault.jpg`
                            : FALLBACK_THUMBNAIL;
                      }}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />

                    {/* Lecture Badge on Top-Right */}
                    {typeof featuredVideo.position === "number" && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[10px] font-mono text-white/95 border border-white/10 font-semibold shadow-sm">
                        Lecture {featuredVideo.position + 1}
                      </span>
                    )}

                    {/* Centered Circular Play Button */}
                    <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/95 text-neutral-900 shadow-2xl flex items-center justify-center pl-0.5 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition duration-200">
                      <Play className="w-5 h-5 fill-current" />
                    </div>

                    {/* Bottom Progress Bar on Thumbnail */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-950/80">
                      <div
                        className="h-full bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.8)] transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(0, featuredProgressPercent))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Right Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-red-500">
                        LAST WATCHED
                      </span>
                      <h3
                        onClick={() => navigate(`/playlist/${featuredPlaylist._id}`)}
                        className="text-lg sm:text-xl font-bold text-[var(--text-main)] tracking-tight hover:text-red-500 transition cursor-pointer line-clamp-1"
                        title={featuredPlaylist.title}
                      >
                        {featuredPlaylist.title}
                      </h3>
                      <p
                        className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed"
                        title={featuredVideo.title}
                      >
                        {featuredVideo.title}
                      </p>
                    </div>

                    {/* Overall Course Progress Bar */}
                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[var(--text-muted)]">
                          Course Progress:{" "}
                          <span className="text-[var(--text-main)] font-bold">{courseProgressPercent}%</span>
                        </span>
                        <span className="text-[var(--text-muted)]">
                          {featuredCompletedVideos} of {featuredTotalVideos} completed
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--surface-hover)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                        <div
                          className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(0, courseProgressPercent))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Real Dynamic Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {featuredProgressPercent > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-lime-500/15 border border-lime-500/30 text-lime-600 dark:text-lime-400">
                          {featuredProgressPercent}% of lecture
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                          Ready to start
                        </span>
                      )}

                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                        {featuredCompletedVideos} / {featuredTotalVideos} videos
                      </span>

                      {remainingHours && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                          {remainingHours}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/playlist/${featuredPlaylist._id}/video/${featuredVideo._id}?start=${
                              featuredVideo.watchedSeconds || 0
                            }`
                          )
                        }
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-red-950/40 transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>
                          {featuredVideo.watchedSeconds && featuredVideo.watchedSeconds > 0
                            ? `Resume at ${formatTime(featuredVideo.watchedSeconds)}`
                            : "Start Lecture"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/playlist/${featuredPlaylist._id}`)}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-semibold transition cursor-pointer text-center"
                      >
                        Open course
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-row: ALSO IN PROGRESS (Responsive Grid with Mini Progress Bars) */}
                {otherCourses.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-[var(--text-muted)] block">
                        ALSO IN PROGRESS ({otherCourses.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/youtube")}
                        className="text-[11px] font-mono text-[var(--text-muted)] hover:text-red-500 transition cursor-pointer flex items-center gap-1 group"
                      >
                        <span>View all</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {otherCourses.map((course) => {
                        const courseProg =
                          typeof course.progress === "number" && course.progress > 0
                            ? course.progress
                            : course.totalVideos > 0
                            ? Math.round(((course.completedVideos || 0) / course.totalVideos) * 100)
                            : 0;

                        return (
                          <div
                            key={course._id}
                            onClick={() => navigate(`/playlist/${course._id}`)}
                            className="flex flex-col justify-between p-3 rounded-xl bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] hover:border-red-500/40 transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-md relative overflow-hidden"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Thumbnail with hover play overlay */}
                              <div className="relative w-16 aspect-video rounded-lg overflow-hidden shrink-0 bg-neutral-950 border border-[var(--border-subtle)]">
                                <img
                                  src={course.thumbnailUrl || FALLBACK_THUMBNAIL}
                                  alt={course.title}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = FALLBACK_THUMBNAIL;
                                  }}
                                  className="w-full h-full object-cover transition group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play className="w-3.5 h-3.5 fill-white text-white" />
                                </div>
                              </div>

                              {/* Title & Info */}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-[var(--text-main)] group-hover:text-red-500 truncate">
                                  {course.title}
                                </h4>
                                <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5 truncate">
                                  {course.completedVideos || 0} / {course.totalVideos || 0} videos
                                  {course.remainingHours ? ` • ${course.remainingHours} hrs left` : ""}
                                </p>
                              </div>

                              {/* Percentage Badge */}
                              <span className="text-xs font-bold font-mono text-red-500 shrink-0">
                                {courseProg}%
                              </span>
                            </div>

                            {/* Mini Course Progress Bar along bottom of each card */}
                            <div className="w-full h-1 bg-[var(--surface-hover)] rounded-full mt-2.5 overflow-hidden">
                              <div
                                className="h-full bg-red-600 rounded-full transition-all duration-300 group-hover:bg-red-500"
                                style={{
                                  width: `${Math.min(100, Math.max(0, courseProg))}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-base font-bold text-theme-main tracking-tight">
                    No active courses in progress
                  </h3>
                  <p className="text-xs text-theme-muted leading-relaxed max-w-md">
                    Import your favorite YouTube playlists to learn with synced notes, bookmarks, and automated progress tracking.
                  </p>
                  <button
                    type="button"
                    onClick={openModal}
                    className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/40 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Import Playlist or Video</span>
                  </button>
                </div>
              </div>
            )}
          </Cutout>
        </section>
      </div>

      {/* Import Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showModal}
        onClose={closeImportModal}
        onImport={handleImport}
        importing={importing}
      />
    </AppShell>
  );
}
