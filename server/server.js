const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const Sentry = require("@sentry/node");

// Config & Middleware
const connectDB = require("./config/db");
const { globalLimiter } = require("./middleware/rateLimiters");

// Route Handlers
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const streakRoutes = require("./routes/streakRoutes");
const videoRoutes = require("./routes/videoRoutes");
const noteRoutes = require("./routes/noteRoutes");
const practiceRoutes = require("./routes/practiceRoutes");
const prephubRoutes = require("./routes/prephubRoutes");
const aiRoutes = require("./routes/aiRoutes");

// Initialize Sentry early if DSN provided
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

const app = express();

// 1. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// 2. Body & Cookie Parsing (MUST BE BEFORE SANITIZERS)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// 3. Data Sanitization against NoSQL Query Injection (Sanitizes body, query & params)
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else {
      sanitizeObject(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
});

// 4. Restricted CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "https://studybuddy.rk-coachings20.workers.dev",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      if (/^https:\/\/.*?\.(workers|pages)\.dev$/i.test(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

// Private Network Access preflight
app.use((req, res, next) => {
  if (req.headers["access-control-request-private-network"]) {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  next();
});

// 5. Global Rate Limiter
app.use(globalLimiter);

// 6. Health check endpoints
app.get(["/", "/api", "/api/health"], (req, res) => {
  res.status(200).json({
    success: true,
    message: "StudyBuddy API is running.",
  });
});

// 7. API Routes
app.use(["/api/auth", "/auth"], authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/prephub", prephubRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", noteRoutes);

// 8. 404 Route Catch-All
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// 9. Centralized Error-Handling Middleware (Ensures JSON responses, hides stack in prod)
app.use((err, req, res, next) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error("❌ Express Error Handler:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 10. Server Boot & Process Lifecycle
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 StudyBuddy API running on http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`⚠️ Port ${PORT} is already in use by another running StudyBuddy server process.`);
      process.exit(1);
    }
  });

  // Keep-alive self-ping for free tier hosting
  let pingTimer = null;
  const extUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;
  if (extUrl) {
    pingTimer = setInterval(() => {
      fetch(`${extUrl.replace(/\/+$/, "")}/api/health`).catch(() => {});
    }, 14 * 60 * 1000);
  }

  const tryConnect = () => {
    connectDB()
      .then(() => {
        console.log("✅ MongoDB Connected successfully");
        const { processPendingJobs } = require("./services/queueService");
        processPendingJobs().catch(() => {});
      })
      .catch((error) => {
        console.error("❌ MongoDB Connection Failed (retrying in 10s):", error.message);
        setTimeout(tryConnect, 10000);
      });
  };
  tryConnect();

  // Graceful shutdown on process termination signals
  const gracefulShutdown = () => {
    console.log("🛑 Shutdown signal received: closing HTTP server...");
    if (pingTimer) clearInterval(pingTimer);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);
}

module.exports = app;
