const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const userResponse = require("../utils/userResponse");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const sendAuthResponse = (res, statusCode, user, token) => {
  res.cookie("token", token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(statusCode).json({
    success: true,
    token,
    user: userResponse(user),
  });
};

exports.logoutUser = (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    if (adminEmail && user.email.toLowerCase() === adminEmail && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    res.status(200).json({
      success: true,
      user: userResponse(user),
    });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential token is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: "Failed to retrieve Google profile" });
    }

    const { email, name, picture, sub: googleId } = payload;
    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    if (!user) {
      user = await User.create({
        username: name?.trim() || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        avatar: picture || "",
        googleId,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save();
    }

    const token = generateToken(user._id);
    sendAuthResponse(res, 200, user, token);
  } catch (error) {
    console.error("Google Auth Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during Google authentication" });
  }
};
