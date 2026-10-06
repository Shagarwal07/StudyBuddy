# StudyBuddy Server — Backend API Workspace
> **One-Liner**: Enterprise Express 5 REST API handling YouTube playlist ingestion, Gemini AI learning guides, and MongoDB streak aggregation.

## 1. Tech Stack (Source of Truth: `package.json`)
- **Runtime**: Node.js `20+`
- **Framework**: Express `5.2.x` (native async error dispatch)
- **Database & ODM**: MongoDB Atlas via Mongoose `9.7.x`
- **Authentication**: JWT (`jsonwebtoken` `9.0.x`), HTTP-only cookies (`cookie-parser`), `bcryptjs`
- **Security & Guarding**: `helmet` `8.3.x`, `cors` `2.8.x`, `express-rate-limit` `8.7.x`, NoSQL sanitizers
- **AI Engine**: Google Gemini API (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`)

## 2. 3 Must-Have Features (Phase 1)
1. **Playlist & Single Video Ingestion**: YouTube Data API v3 integration with automated duration extraction and playlist progress cards.
2. **AI Learning Companion & Guides**: Gemini AI prompt pipelines for modular study guides, chapter summaries, and code solutions.
3. **Daily Study & Streak Tracker**: Atomic `{ userId, date }` daily activity updates driving user streaks and time accounting.

## 3. Out-of-Scope (Non-Goals)
1. Video hosting or binary video file processing (metadata & transcripts only).
2. Unprotected or unthrottled AI endpoints (all protected by JWT + rate limiters).
3. Browser extension specific endpoints (quarantined to future roadmap).

## 4. Quick Start (Terminal Protocol)
**Run this in:** `d:\IWS PROJECT\RKCoaching_Projects\StudyBuddy\server\`
```bash
npm install
npm run dev
```
- **Local API**: `http://localhost:5000/api`
- **Health Check**: `GET http://localhost:5000/api/health`

