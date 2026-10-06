const User = require("../models/User");
const userResponse = require("../utils/userResponse");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: userResponse(user),
    });
  } catch (error) {
    console.error("[Get Profile]", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, name, email, badge, leetcodeHandle, codeforcesHandle } = req.body;
    const targetUsername = (username || name)?.trim();

    if (!targetUsername || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const updateFields = {
      username: targetUsername,
      email: email.trim().toLowerCase(),
    };

    if (badge !== undefined) updateFields.badge = badge.trim();
    if (leetcodeHandle !== undefined) updateFields.leetcodeHandle = leetcodeHandle.trim();
    if (codeforcesHandle !== undefined) updateFields.codeforcesHandle = codeforcesHandle.trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse(updatedUser),
    });
  } catch (error) {
    console.error("[Update Profile]", error.message);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email is already in use" });
    }
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};
