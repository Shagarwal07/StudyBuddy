<div align="center">

# 🎯 StudyBuddy

### The Developer Learning Ecosystem & Practice Workspace

*Transform YouTube playlists into distraction-free, ad-free learning workspaces with timestamped notes, master DSA sheets, and track your study streak.*

<br/>

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express 5](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Gemini API](https://img.shields.io/badge/Google_Cloud-Gemini_AI-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://ai.google.dev/)

</div>

---

## 🚀 Overview

**StudyBuddy** eliminates developer context switching. Instead of juggling scattered YouTube tabs, external PDFs, and spreadsheets, StudyBuddy unifies developer education into an ad-free, high-performance command center.

### 🌟 3 Must-Have Core Features
1. **Ad-Free YouTube Course Workspace**: Paste any public playlist or video link to generate structured, ad-free courses with smart auto-resume, video progress tracking, and timestamp-anchored note taking.
2. **Practice Studio & Curated DSA Roadmaps**: Master Striver's SDE 180, Striver A2Z, NeetCode 150, and Codeforces Rating Ladders with Google Gemini-powered AI study guides, hints, and code explanations.
3. **Core CS Prephub & Analytics**: Structured syllabus mastery for Operating Systems, DBMS, Networks, and SQL with a GitHub-style daily activity heatmap and streak tracker.

### 🔮 Future Roadmap
* **Companion Browser Extension (Manifest V3)**: Real-time background judge synchronization for LeetCode and Codeforces (currently isolated in `extension/`).

---

## 🛠️ Tech Stack (Source of Truth: Manifests)

| Layer | Technologies | Manifest Source |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, React Router v7, KaTeX, PrismJS | [`client/package.json`](client/package.json) |
| **Backend** | Node.js (>=20), Express 5, Mongoose 9, Helmet, CORS, Rate Limiters | [`server/package.json`](server/package.json) |
| **Database** | MongoDB Atlas (Compound indexed `{ userId, date }`, `{ playlistId, position }`) | [`server/models/`](server/models/) |
| **AI Engine** | Google Gemini API (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`) | [`server/config/geminiClient.js`](server/config/geminiClient.js) |

---

## 📁 Project Architecture

```text
StudyBuddy/
├── client/                     # Frontend SPA (React 19 + Vite 8 + Tailwind v4)
│   ├── src/
│   │   ├── components/         # UI Components (TopBar, Sidebar, Modals, Heatmap)
│   │   ├── context/            # AuthContext & ThemeContext
│   │   ├── pages/              # Dashboard, Practice, Prephub, YouTubeHub, Settings
│   │   └── api/                # Axios client with JWT session credentials
│   └── package.json
│
├── server/                     # Backend API Server (Node.js + Express 5)
│   ├── config/                 # MongoDB connection & Gemini AI client
│   ├── controllers/            # Dashboard, Playlist, Practice, Streak, Video controllers
│   ├── middleware/             # Auth, RateLimiter, Ownership, AI Validation
│   ├── models/                 # Mongoose 9 models (User, Playlist, Video, DailyActivity)
│   ├── routes/                 # Express route declarations
│   ├── services/               # YouTube Data API v3 & Gemini AI services
│   ├── utils/                  # Functional utilities (playlistStats, updateDailyActivity)
│   └── server.js               # Application entrypoint & graceful lifecycle
│
├── extension/                  # Companion Browser Extension (Future Roadmap - Manifest V3)
├── .env.example                # Unified environment variable template
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
* **Node.js** `>= 20.x`
* **MongoDB** connection string
* **YouTube Data API v3 Key** & **Gemini API Key**

### 2. Environment Setup
Copy `.env.example` in both server and client folders:
```bash
# Server environment
cp .env.example server/.env
# Frontend environment
cp client/.env.example client/.env
```

### 3. Run the Development Servers
Open two terminal sessions:

```bash
# Terminal 1 — Backend API (Runs on http://localhost:5000)
cd server
npm install
npm run dev

# Terminal 2 — Frontend Client (Runs on http://localhost:5173)
cd client
npm install
npm run dev
```

---

## 📜 License
Distributed under the **MIT License**.
