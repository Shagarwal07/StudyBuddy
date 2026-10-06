# StudyBuddy Client — Frontend Workspace
> **One-Liner**: High-performance React 19 Single Page Application for distraction-free YouTube course tracking, interactive DSA sheets, and LaTeX STEM note rendering.

## 1. Tech Stack (Source of Truth: `package.json`)
- **Framework**: React `19.2.x` + React DOM `19.2.x`
- **Build Tool**: Vite `8.1.x` (`@vitejs/plugin-react` `6.0.x`)
- **Styling**: Tailwind CSS `v4.3.x` with native `@tailwindcss/vite`
- **Routing**: React Router DOM `7.18.x`
- **STEM & Code Engine**: `react-markdown` (v10), `remark-math`, `rehype-katex`, `katex`, `prismjs`
- **Icons & Telemetry**: `lucide-react`, `react-hot-toast`, `@sentry/react`

## 2. 3 Must-Have Features (Phase 1)
1. **Ad-Free Video Learning Player**: YouTube IFrame playback synchronization with timestamped Markdown/LaTeX notes.
2. **Practice Studio & Sheet Explorer**: Dynamic roadmap viewer with difficulty filters, search, and Stufu AI modal.
3. **Activity Heatmap & Streak Dashboard**: GitHub-style contribution grid tracking daily study time and solved problems.

## 3. Out-of-Scope (Non-Goals)
1. Server-side rendering (SSR) or Next.js migrations (client is strictly an optimized client-side SPA).
2. Direct YouTube video downloading or in-browser video transcode.
3. Live judge scraping inside the client (handled externally or via future extension).

## 4. Quick Start (Terminal Protocol)
**Run this in:** `d:\IWS PROJECT\RKCoaching_Projects\StudyBuddy\client\`
```bash
npm install
npm run dev
```
- **Local URL**: `http://localhost:5173`
- **Build Verification**: `npm run build`
- **Linter Check**: `npm run lint`

