// StudyBuddy – Multi-Platform Coding Sync Content Script (Ponytail Minimalist)
// Real-time submission observer for LeetCode, Codeforces, and GeeksforGeeks

const host = window.location.hostname;
const PLATFORM = host.includes("leetcode.com") ? "LeetCode"
  : host.includes("codeforces.com") ? "Codeforces"
  : host.includes("geeksforgeeks.org") ? "GeeksforGeeks"
  : host.includes("youtube.com") ? "YouTube"
  : "Unknown";

const inFlight = new Set();
let cachedKeys = new Set();
let checkTimer = null;

const normalizeKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Pre-load and sync cached solved keys from extension storage
chrome.storage.local.get(["studybuddy_solved_keys"], (d) => {
  if (Array.isArray(d.studybuddy_solved_keys)) d.studybuddy_solved_keys.forEach((k) => cachedKeys.add(normalizeKey(k)));
});
chrome.storage.onChanged.addListener((c, area) => {
  if (area === "local" && c.studybuddy_solved_keys?.newValue) {
    cachedKeys = new Set(c.studybuddy_solved_keys.newValue.map(normalizeKey));
  }
});

// -------------------------------------------------------------
// 1. Billu 3D Cutout & Error Notification
// -------------------------------------------------------------
function showStudyBuddyError(message) {
  document.getElementById("studybuddy-toast")?.remove();
  const toast = document.createElement("div");
  toast.id = "studybuddy-toast";
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
    padding: 10px 16px; border-radius: 12px; background: #0b0d14; color: #fca5a5;
    border: 1px solid #ef4444; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px; font-weight: 500; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
    display: flex; align-items: center; gap: 8px; pointer-events: none;
  `;
  toast.innerHTML = `<span>⚠️</span><span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showBilluSolvedCutout() {
  document.getElementById("studybuddy-billu-cutout")?.remove();

  const imgUrl = chrome.runtime.getURL("assets/billu-solved-3d.png");
  const container = document.createElement("div");
  container.id = "studybuddy-billu-cutout";
  container.style.cssText = `
    position: fixed; bottom: 16px; right: 20px; z-index: 2147483647;
    pointer-events: none; display: flex; flex-direction: column; align-items: center;
    transition: transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
    transform: translateY(40px) scale(0.7); opacity: 0;
  `;

  container.innerHTML = `
    <img src="${imgUrl}" alt="Solved!" style="
      width: 175px; height: 175px; object-fit: contain;
      filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.65));
      animation: sbBilluFloat 1.8s ease-in-out infinite alternate;
    " />
  `;

  if (!document.getElementById("sb-billu-style")) {
    const style = document.createElement("style");
    style.id = "sb-billu-style";
    style.textContent = `
      @keyframes sbBilluFloat {
        0% { transform: translateY(0); }
        100% { transform: translateY(-8px); }
      }
      @keyframes sbSpin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(container);

  requestAnimationFrame(() => {
    container.style.transform = "translateY(0) scale(1)";
    container.style.opacity = "1";
  });

  setTimeout(() => {
    container.style.transform = "translateY(30px) scale(0.7)";
    container.style.opacity = "0";
    setTimeout(() => container.remove(), 450);
  }, 4200);
}

// -------------------------------------------------------------
// 2. In-Page Problem Solved Badge
// -------------------------------------------------------------
function renderStatusBadge(isSolved) {
  document.getElementById("studybuddy-status-badge")?.remove();

  const badge = document.createElement("div");
  badge.id = "studybuddy-status-badge";
  badge.style.cssText = `
    position: fixed; top: 60px; right: 20px; z-index: 99999;
    padding: 6px 12px; border-radius: 20px; background: #0f172a;
    color: ${isSolved ? "#34d399" : "#94a3b8"};
    border: 1px solid ${isSolved ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)"};
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); pointer-events: none;
  `;
  badge.innerHTML = `
    <span style="font-weight: 700; color: #fff;">Study</span><span style="font-weight: 900; background: linear-gradient(135deg, #FF4D4D, #FFA270); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Buddy</span>
    <span style="color: ${isSolved ? "#34d399" : "#94a3b8"}; font-weight: 600; margin-left: 4px;">${isSolved ? "Solved ✓" : "Sync Ready"}</span>
  `;
  document.body.appendChild(badge);
}

function checkCurrentProblemStatus() {
  const slug = getCurrentSlug();
  if (!slug) return;
  const norm = normalizeKey(slug);
  renderStatusBadge(cachedKeys.has(norm));
}

// -------------------------------------------------------------
// 3. Problem Slug Extraction
// -------------------------------------------------------------
function getCurrentSlug() {
  const path = window.location.pathname;
  if (PLATFORM === "LeetCode") return path.match(/\/problems\/([^/]+)/)?.[1] || null;
  if (PLATFORM === "Codeforces") {
    const m = path.match(/(?:contest|problemset\/problem)\/(\d+)\/([A-Za-z0-9]+)/);
    return m ? `cf-${m[1]}${m[2]}`.toLowerCase() : null;
  }
  if (PLATFORM === "GeeksforGeeks") return path.match(/\/problems\/([^/]+)/)?.[1] || null;
  return null;
}

// -------------------------------------------------------------
// 4. Submission Sync Logic
// -------------------------------------------------------------
function syncToStudyBuddy(problemSlug) {
  const norm = normalizeKey(problemSlug);
  if (!norm || cachedKeys.has(norm) || inFlight.has(norm)) {
    if (cachedKeys.has(norm)) renderStatusBadge(true);
    return;
  }

  // Synchronous lock immediately before async message
  inFlight.add(norm);

  chrome.runtime.sendMessage(
    { action: "SYNC_SUBMISSION", payload: { problemSlug, platform: PLATFORM } },
    (res) => {
      inFlight.delete(norm);

      if (chrome.runtime.lastError || !res?.success) {
        return showStudyBuddyError(res?.message || "Sync failed. Ensure StudyBuddy is linked in extension.");
      }

      cachedKeys.add(norm);
      chrome.storage.local.get(["studybuddy_solved_keys"], (d) => {
        const keys = d.studybuddy_solved_keys || [];
        if (!keys.includes(norm)) chrome.storage.local.set({ studybuddy_solved_keys: [...keys, norm] });
      });

      renderStatusBadge(true);
      if (!res?.alreadySolved) showBilluSolvedCutout();
    }
  );
}

// -------------------------------------------------------------
// 5. Verdict Observers (LeetCode, Codeforces, GFG)
// -------------------------------------------------------------
function detectVerdictElement() {
  if (PLATFORM === "LeetCode") {
    const el = document.querySelector('[data-e2e-locator="submission-result"]');
    if (el?.textContent?.trim() === "Accepted") return el;
    const modal = document.querySelector('[class*="result-container"], [class*="submission-result"]');
    const badge = modal?.querySelector('.text-green-s, .text-emerald-500, .text-green-500');
    return badge?.textContent?.trim() === "Accepted" ? badge : null;
  }
  if (PLATFORM === "Codeforces") return document.querySelector(".verdict-accepted");
  if (PLATFORM === "GeeksforGeeks") {
    return document.querySelector(".problem-solved, .solved-status") ||
      (document.querySelector(".modal, .toast, [class*='result']")?.textContent?.includes("Problem Solved Successfully") ? document.body : null);
  }
  return null;
}

function checkVerdict() {
  const slug = getCurrentSlug();
  const norm = normalizeKey(slug);
  if (!norm || cachedKeys.has(norm) || inFlight.has(norm)) return;

  const el = detectVerdictElement();
  if (!el || el.dataset?.sbSeen === "1") return;
  if (el.dataset) el.dataset.sbSeen = "1";

  syncToStudyBuddy(slug);
}

function setupVerdictObserver() {
  const observer = new MutationObserver(() => {
    clearTimeout(checkTimer);
    checkTimer = setTimeout(checkVerdict, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(checkVerdict, 1000);
}

// -------------------------------------------------------------
// 6. SPA Route Tracking (pushState, replaceState & popstate)
// -------------------------------------------------------------
function setupSpaNavigationTracker() {
  const wrap = (fn) => function (...args) {
    fn.apply(this, args);
    setTimeout(checkCurrentProblemStatus, 300);
  };
  history.pushState = wrap(history.pushState);
  history.replaceState = wrap(history.replaceState);
  window.addEventListener("popstate", () => setTimeout(checkCurrentProblemStatus, 300));
}

// -------------------------------------------------------------
// 7. YouTube 1-Click Course / Playlist Importer
// -------------------------------------------------------------
function setupYouTubeIntegration() {
  function injectBtn() {
    if (document.getElementById("studybuddy-yt-btn")) return;
    const path = window.location.pathname;
    if (path !== "/watch" && path !== "/playlist") return;

    const target = document.querySelector(
      "#actions #top-level-buttons-computed, ytd-watch-metadata #actions, ytd-playlist-header-renderer #actions-inner, #actions.ytd-playlist-header-renderer"
    );
    if (!target) return;

    const btn = document.createElement("button");
    btn.id = "studybuddy-yt-btn";
    btn.type = "button";
    btn.title = "Import this course/playlist into StudyBuddy";
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; display:inline-block; vertical-align:middle;">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
        <path d="M12 6v6"></path>
        <path d="M9 9h6"></path>
      </svg>
      <span style="display:inline-flex; align-items:center; gap:2px; white-space:nowrap; vertical-align:middle;">
        <span style="color:#ffffff; font-weight:700; font-size:12px; letter-spacing: -0.2px;">Add to</span>
        <span style="color:#ffffff; font-weight:700; font-size:12px; margin-left:2px;">Study</span><span style="background:linear-gradient(135deg, #FF4D4D, #FFA270); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-weight:900; font-size:12px;">Buddy</span>
      </span>
    `;
    btn.style.cssText = `
      display: inline-flex !important; flex-direction: row !important;
      align-items: center !important; justify-content: center !important;
      gap: 7px !important; white-space: nowrap !important; flex-shrink: 0 !important;
      background: #0f0f13 !important; color: #f8fafc !important;
      border: 1px solid rgba(239, 68, 68, 0.45) !important; border-radius: 18px !important;
      padding: 0 14px !important; height: 36px !important;
      font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif !important;
      cursor: pointer !important; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
      margin-left: 8px !important; vertical-align: middle !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important; box-sizing: border-box !important;
      user-select: none !important;
    `;
    btn.onmouseover = () => {
      btn.style.background = "#18181f !important";
      btn.style.borderColor = "#ef4444 !important";
      btn.style.boxShadow = "0 0 12px rgba(239, 68, 68, 0.35) !important";
      btn.style.transform = "translateY(-1px)";
    };
    btn.onmouseout = () => {
      btn.style.background = "#0f0f13 !important";
      btn.style.borderColor = "rgba(239, 68, 68, 0.45) !important";
      btn.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.35) !important";
      btn.style.transform = "translateY(0)";
    };

    const resetBtn = () => {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
          <path d="M12 6v6"></path>
          <path d="M9 9h6"></path>
        </svg>
        <span style="display:inline-flex; align-items:center; gap:2px; white-space:nowrap;">
          <span style="color:#ffffff; font-weight:700; font-size:12px;">Add to</span>
          <span style="color:#ffffff; font-weight:700; font-size:12px; margin-left:2px;">Study</span><span style="background:linear-gradient(135deg, #FF4D4D, #FFA270); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-weight:900; font-size:12px;">Buddy</span>
        </span>
      `;
    };

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.disabled = true;
      btn.innerHTML = `
        <span style="display:inline-block; width:12px; height:12px; border:2px solid #ef4444; border-top-color:transparent; border-radius:50%; animation:sbSpin 0.7s linear infinite;"></span>
        <span style="font-weight:600; font-size:12px; color:#e2e8f0; white-space:nowrap;">Adding course...</span>
      `;

      // Safety timeout so button never gets stuck
      const safetyTimer = setTimeout(() => {
        resetBtn();
        showStudyBuddyError("Import timed out. Make sure StudyBuddy is running and account is linked in extension.");
      }, 20000);

      chrome.runtime.sendMessage(
        { action: "SYNC_YOUTUBE", payload: { url: window.location.href } },
        (res) => {
          clearTimeout(safetyTimer);
          if (chrome.runtime.lastError || !res?.success) {
            resetBtn();
            showStudyBuddyError(res?.message || chrome.runtime.lastError?.message || "Import failed. Make sure StudyBuddy is connected.");
            return;
          }
          btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span style="font-weight:700; font-size:12px; color:#34d399; white-space:nowrap;">Added!</span>
          `;
          btn.style.borderColor = "rgba(16, 185, 129, 0.6) !important";
          btn.style.background = "rgba(16, 185, 129, 0.12) !important";
          showBilluSolvedCutout();
        }
      );
    };

    target.appendChild(btn);
  }

  setInterval(injectBtn, 1200);
  window.addEventListener("yt-navigate-finish", () => setTimeout(injectBtn, 500));
}

// -------------------------------------------------------------
// 8. Initialization
// -------------------------------------------------------------
function init() {
  if (PLATFORM === "YouTube") {
    setupYouTubeIntegration();
    return;
  }
  setupVerdictObserver();
  setupSpaNavigationTracker();
  checkCurrentProblemStatus();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
