const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });



const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db.js");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const streakRoutes = require("./routes/streakRoutes");
const videoRoutes = require("./routes/videoRoutes");
const noteRoutes = require("./routes/noteRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const prephubRoutes = require("./routes/prephubRoutes");
// const aiRoutes = require("./routes/aiRoutes"); // Added in Commit 3

const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { globalLimiter } = require("./middleware/rateLimiters");
const Sentry = require("@sentry/node");

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

const app = express();

// 1. Security Headers (HSTS, clickjacking, MIME sniffing protection)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// 2. Data Sanitization against NoSQL Query Injection (strips $ and . from inputs, Express 5 native)
app.use((req, res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else {
        clean(obj[key]);
      }
    }
  };
  if (req.body) clean(req.body);
  if (req.params) clean(req.params);
  next();
});

// 3. Cookie Parser for httpOnly JWT sessions
app.use(cookieParser());

// 4. Body parser
app.use(express.json({ limit: "1mb" }));

// 5. Restricted CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Explicitly allowed web client origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Browser extension origins (Chrome, Edge, Firefox, Brave)
      if (origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")) {
        return callback(null, true);
      }

      // LeetCode origins for direct content-script sync
      if (/^https:\/\/([a-z0-9-]+\.)?leetcode\.(com|cn)$/i.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS policy violation: Access blocked."));
    },
    credentials: true,
  })
);

// Support Chrome Private Network Access preflight
app.use((req, res, next) => {
  if (req.headers["access-control-request-private-network"]) {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  next();
});

// 6. Global Rate Limiter (DDoS & Bot Shield)
app.use(globalLimiter);

// Health check endpoints (Unprotected)
app.get(["/", "/api", "/api/health"], (req, res) => {
  res.status(200).json({
    success: true,
    message: "StudyBuddy API is running.",
  });
});

// Modular API routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/prephub", prephubRoutes);
// app.use("/api/ai", aiRoutes); // Added in Commit 3
app.use("/api", noteRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production" || require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 StudyBuddy API running on http://localhost:${PORT}`);
  });

  const tryConnect = () => {
    connectDB()
      .then(() => {
        console.log("✅ MongoDB Connected successfully");
      })
      .catch((error) => {
        console.error("❌ MongoDB Connection Failed (retrying in 10s):", error.message);
        setTimeout(tryConnect, 10000);
      });
  };
  tryConnect();
}

module.exports = app;
