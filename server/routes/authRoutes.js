const express = require("express");
const router = express.Router();

const { logoutUser, googleAuth, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiters");

router.post("/google", authLimiter, googleAuth);
router.post("/logout", logoutUser);
router.get("/me", authMiddleware, getMe);

module.exports = router;
