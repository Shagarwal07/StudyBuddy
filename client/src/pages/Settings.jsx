import { User, Palette, Info, LogOut, Code2, ExternalLink, Unlink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState, useCallback } from "react";
import useSettings from "../hooks/useSettings";
import Loader from "../components/common/Loader";
import api from "../api/axios";

import AppShell from "../components/layout/AppShell";
import SettingsSection from "../components/settings/SettingsSection";
import SettingsItem from "../components/settings/SettingsItem";

const TABS = [
  { id: "account", label: "Profile & Account", icon: User },
  // { id: "appearance", label: "Appearance", icon: Palette }, // Added in Commit 4
  { id: "about", label: "About", icon: Info },
  { id: "danger", label: "Danger Zone", icon: LogOut, isDanger: true },
];

const PRESET_BADGES = [
  "DSA Master",
  "Full Stack Dev",
  "Competitive Programmer",
  "LeetCode Grinder",
];

export default function Settings() {
  const navigate = useNavigate();
  const { logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("account");

  const { user, loading, updateProfile } = useSettings();

  const [profileSaving, setProfileSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    badge: "",
    leetcodeHandle: "",
    codeforcesHandle: "",
  });

  const handleProfileChange = useCallback((e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUpdateProfile = useCallback(
    async (e) => {
      e.preventDefault();
      setProfileSaving(true);
      try {
        const targetName = profile.name.trim();
        const targetEmail = profile.email.trim();

        const success = await updateProfile(
          targetName,
          targetEmail,
          profile.badge,
          profile.leetcodeHandle,
          profile.codeforcesHandle
        );

        if (success && refreshUser) {
          await refreshUser();
        }
      } catch (error) {
        console.error(
          "[Settings] Update Profile Failure:",
          error.message || error,
        );
      } finally {
        setProfileSaving(false);
      }
    },
    [profile, updateProfile, refreshUser],
  );

  const handleDisconnectLeetcode = useCallback(async () => {
    setProfileSaving(true);
    try {
      setProfile((prev) => ({ ...prev, leetcodeHandle: "" }));
      const [success] = await Promise.all([
        updateProfile(
          profile.name.trim(),
          profile.email.trim(),
          profile.badge,
          "",
          profile.codeforcesHandle
        ),
        api.post("/practice/reset-progress").catch((e) => {
          console.warn("[Settings] Reset progress warning:", e);
        }),
      ]);
      if (success && refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      console.error(
        "[Settings] Disconnect LeetCode Failure:",
        error.message || error,
      );
    } finally {
      setProfileSaving(false);
    }
  }, [profile, updateProfile, refreshUser]);

  const handleDisconnectCodeforces = useCallback(async () => {
    setProfileSaving(true);
    try {
      setProfile((prev) => ({ ...prev, codeforcesHandle: "" }));
      const success = await updateProfile(
        profile.name.trim(),
        profile.email.trim(),
        profile.badge,
        profile.leetcodeHandle,
        ""
      );
      if (success && refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      console.error(
        "[Settings] Disconnect Codeforces Failure:",
        error.message || error,
      );
    } finally {
      setProfileSaving(false);
    }
  }, [profile, updateProfile, refreshUser]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || user.username || "",
        email: user.email || "",
        badge: user.badge && user.badge !== "Basic User" ? user.badge : "",
        leetcodeHandle: user.leetcodeHandle || "",
        codeforcesHandle: user.codeforcesHandle || "",
      });
    }
  }, [user]);

  if (loading) {
    return (
      <Loader
        text="Loading Settings..."
        subtitle="Fetching your profile."
        fullscreen
      />
    );
  }

  return (
    <AppShell title="Settings" showBack={false}>
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6 lg:gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-56 lg:w-60 shrink-0 flex flex-col gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left border cursor-pointer ${
                  isActive
                    ? tab.isDanger
                      ? "bg-rose-950/40 border-rose-600/40 text-rose-400"
                      : "bg-red-950/30 border-red-900/50 text-red-400 shadow-sm"
                    : "border-transparent text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isActive
                      ? tab.isDanger
                        ? "text-rose-500"
                        : "text-red-400"
                      : "text-neutral-500 group-hover:text-neutral-300"
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl space-y-8">
          {activeTab === "account" && (
            <>
              {/* Profile Section */}
              <SettingsSection title="Profile Information & Badge">
                <form
                  onSubmit={handleUpdateProfile}
                  className="divide-y divide-neutral-800"
                >
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          autoComplete="name"
                          value={profile.name}
                          onChange={handleProfileChange}
                          className="w-full bg-[#0E0E12] border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-neutral-400">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          autoComplete="email"
                          value={profile.email}
                          onChange={handleProfileChange}
                          className="w-full bg-[#0E0E12] border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Badge Selection */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-400">
                          Platform Badge (Optional, Displayed in TopBar)
                        </label>
                        {profile.badge && (
                          <button
                            type="button"
                            onClick={() => setProfile((p) => ({ ...p, badge: "" }))}
                            className="text-[11px] text-neutral-400 hover:text-rose-400 transition cursor-pointer"
                          >
                            Remove Badge
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {PRESET_BADGES.map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() =>
                              setProfile((p) => ({
                                ...p,
                                badge: p.badge === b ? "" : b,
                              }))
                            }
                            className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer border ${
                              profile.badge === b
                                ? "bg-red-950/30 text-red-400 border-red-500/40"
                                : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* LeetCode Handle Input */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-red-400" />
                          LeetCode Public Username
                        </label>
                        {profile.leetcodeHandle && (
                          <div className="flex items-center gap-2.5">
                            <a
                              href={`https://leetcode.com/u/${profile.leetcodeHandle}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1"
                            >
                              <span>View Profile</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={handleDisconnectLeetcode}
                              disabled={profileSaving}
                              className="text-xs text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/20 disabled:opacity-50"
                              title="Disconnect LeetCode handle"
                            >
                              <Unlink className="w-3 h-3" />
                              <span>Disconnect</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        name="leetcodeHandle"
                        value={profile.leetcodeHandle}
                        onChange={handleProfileChange}
                        placeholder="e.g. your_leetcode_username"
                        className="w-full bg-[#0E0E12] border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
                      />
                    </div>

                    {/* Codeforces Handle Input */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-blue-400" />
                          Codeforces Public Username
                        </label>
                        {profile.codeforcesHandle && (
                          <div className="flex items-center gap-2.5">
                            <a
                              href={`https://codeforces.com/profile/${profile.codeforcesHandle}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                            >
                              <span>View Profile</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              type="button"
                              onClick={handleDisconnectCodeforces}
                              disabled={profileSaving}
                              className="text-xs text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/20 disabled:opacity-50"
                              title="Disconnect Codeforces handle"
                            >
                              <Unlink className="w-3 h-3" />
                              <span>Disconnect</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        name="codeforcesHandle"
                        value={profile.codeforcesHandle}
                        onChange={handleProfileChange}
                        placeholder="e.g. tourist"
                        className="w-full bg-[#0E0E12] border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="px-6 py-3.5 bg-[#0e0e12]/60 border-t border-neutral-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#BA3C3C] to-[#E04D4D] hover:opacity-90 text-white text-xs font-semibold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shadow-red-500/20"
                    >
                      {profileSaving && (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>
                        {profileSaving ? "Saving..." : "Save Profile"}
                      </span>
                    </button>
                  </div>
                </form>
              </SettingsSection>
            </>
          )}

          {activeTab === "appearance" && (
            <SettingsSection title="Appearance">
              <SettingsItem
                icon={Palette}
                title="Theme Mode"
                subtitle="System theme preferences"
                right={
                  <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs gap-1">
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        theme === "dark"
                          ? "bg-red-950/30 border border-red-500/40 text-red-400"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        theme === "light"
                          ? "bg-red-950/30 border border-red-500/40 text-red-400"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      Light
                    </button>
                  </div>
                }
              />
            </SettingsSection>
          )}

          {activeTab === "about" && (
            <SettingsSection title="About">
              <SettingsItem
                icon={Info}
                title="Version Control"
                subtitle="StudyBuddy Build System"
                right={
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-400">
                      v2.0.0
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-lg font-mono">
                      Latest
                    </span>
                  </div>
                }
              />
            </SettingsSection>
          )}

          {activeTab === "danger" && (
            <SettingsSection title="Danger Zone">
              <SettingsItem
                icon={LogOut}
                title="Logout"
                subtitle="Sign out of your active terminal session"
                danger
                onClick={handleLogout}
              />
            </SettingsSection>
          )}
        </main>
      </div>
    </AppShell>
  );
}
