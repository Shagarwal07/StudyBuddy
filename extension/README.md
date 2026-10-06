# ⚡ StudyBuddy Companion Extension (Manifest V3)
> **POV: His Helper** — Real-time coding synchronization for LeetCode, Codeforces, and GeeksforGeeks.

The **StudyBuddy Companion Extension** connects your everyday coding judge activity directly with your StudyBuddy developer profile, automatically tracking accepted submissions, updating streaks, and keeping your DSA roadmaps up to date.

---

## ✨ Features at a Glance

### 1. 🔄 Multi-Platform Real-Time Sync
* **LeetCode**: Instant detection of `Accepted` solutions across both classic and dynamic React/Next.js interfaces.
* **Codeforces**: Automatically tracks contest and problemset submissions with `OK` / `Accepted` verdicts.
* **GeeksforGeeks**: Instant tracking for `Problem Solved Successfully` outcomes.

### 2. ⚡ Dual-Platform Historical Bulk Sync (Option B)
* **LeetCode Backfill**: 1-click import of all past accepted problems using LeetCode's session API.
* **Codeforces Backfill**: Fetches all solved submissions via Codeforces' official public API (`user.status`) and maps them straight into StudyBuddy's **Codeforces Ladder** (269 problems).
* **Segment Platform Switcher**: Clean Obsidian toggle pills for LeetCode (gold) and Codeforces (blue).

### 3. 🎯 In-Page Problem Solved Overlay
* When browsing problem pages on LeetCode or Codeforces, an unobtrusive floating badge displays your status (`StudyBuddy Solved ✓` or `StudyBuddy Sync Ready`).
* Automatically detects Single Page Application (SPA) navigation (`pushState`, `replaceState`, `popstate`) without requiring full page refreshes.

### 4. 🔒 Write-Only JWT Security
* Your authentication token is **write-only**: once pasted or auto-detected, the raw token is never exposed in the DOM `value` or inspector.
* Native clipboard guards strictly prevent `copy`, `cut`, `select`, `contextmenu`, and `dragstart` on token inputs.

### 5. 🌐 Environment Presets
* **Local Dev**: Configured for `http://localhost:5000/api`.
* **Live / Cloudflare**: Configured for your production Cloudflare Pages or custom backend domain.
* **1-Click Auto-Detect**: Instantly pulls your active authentication token from any open StudyBuddy tab (`localhost:5173` or `*.pages.dev`).

### 6. 📊 Platform-Matching Obsidian Dashboard
* Clean dark aesthetic with vector SVG icons matching the StudyBuddy web platform:
  * 🔥 **Day Streak**
  * 🎯 **Today Solved**
  * 💻 **Total Solved**

---

## 🛠️ Installation Instructions

1. Open **Google Chrome** (or Edge / Brave / Arc).
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** (top-left button).
5. Select this folder:
   ```text
   StudyBuddy/extension
   ```
6. The **StudyBuddy – Coding Sync** extension is ready with its official flame monogram icon!

---

## 🚀 Quick Start Guide

1. Open your StudyBuddy web application in a browser tab.
2. Click the **StudyBuddy extension icon** in your browser toolbar.
3. Click **"Auto-Detect Token from Open Tab"** — your profile, avatar, streak, and solved count will connect immediately!
4. *(Optional)* Switch to **Codeforces**, enter your username, and click **"Sync Solved History (Codeforces)"** to backfill your contest history.

---

## 🛡️ Architecture & Security
* Built purely with **Manifest V3** standard web APIs.
* **Zero external dependencies**: bloat-free, sub-millisecond execution.
* Background service worker handles network requests with elevated host permissions to bypass CORS and CSP safely.
