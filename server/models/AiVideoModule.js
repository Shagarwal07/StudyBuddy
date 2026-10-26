const mongoose = require("mongoose");

const AiVideoModuleSchema = new mongoose.Schema(
  {
    ytVideoId: {
      type: String,
      required: true,
      index: true,
    },
    moduleIndex: {
      type: Number,
      required: true,
    },
    promptVersion: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: 3,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    markdownContent: {
      type: String,
      required: true,
    },
    keyInsights: [
      {
        type: String,
      },
    ],
    startSeconds: {
      type: Number,
      default: 0,
    },
    endSeconds: {
      type: Number,
      default: 0,
    },
    timeFormatted: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: guarantees exactly one module doc per video, chapter, and prompt version
AiVideoModuleSchema.index(
  { ytVideoId: 1, moduleIndex: 1, promptVersion: 1 },
  { unique: true }
);

module.exports = mongoose.model("AiVideoModule", AiVideoModuleSchema);
