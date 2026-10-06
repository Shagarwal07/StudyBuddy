const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    default: "",
  },
  googleId: {
    type: String,
    sparse: true,
    index: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  badge: {
    type: String,
    default: "",
  },
  leetcodeHandle: {
    type: String,
    default: "",
    trim: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isRkStudent: {
    type: Boolean,
    default: false,
  },
  rkStatus: {
    type: String,
    enum: ["none", "pending", "approved", "rejected"],
    default: "none",
  },
  rkStudentDetails: {
    studentName: { type: String, default: "" },
    rollNo: { type: String, default: "" },
    batch: { type: String, default: "" },
    contact: { type: String, default: "" },
    requestedAt: { type: Date },
    approvedAt: { type: Date },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
