const mongoose = require("mongoose");

const ProblemItemSchema = new mongoose.Schema(
  {
    id: String,
    number: String,
    title: String,
    module: String,
    platform: { type: String, default: "" },
    platformUrl: { type: String, default: "" },
    leetcodeId: String,
    leetcodeDifficulty: String,
    leetcodeUrl: String,
    questionUrl: { type: String, default: "" },
    solutionUrl: { type: String, default: "" },
    instructorUrl: { type: String, default: "" },
    hasNotes: { type: Boolean, default: false },
    key: String,
  },
  { _id: false }
);

const GlobalSheetSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "DSA Patterns",
    },
    group: {
      type: String,
      enum: ["dsa", "core", "rk"],
      default: "dsa",
    },
    badge: {
      type: String,
      default: "Developer / Admin",
    },
    sourceUrl: {
      type: String,
      default: "",
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    isOfficial: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      name: { type: String, default: "Developer / Admin" },
      role: { type: String, default: "admin" },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    problems: [ProblemItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("GlobalSheet", GlobalSheetSchema);
