const mongoose = require("mongoose");

const RoadmapItemSchema = new mongoose.Schema(
  {
    index: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
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
    overview: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const ModuleItemSchema = new mongoose.Schema(
  {
    moduleIndex: {
      type: Number,
      default: 0,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
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
    keyInsights: [
      {
        type: String,
      },
    ],
    codeSnippets: [
      {
        type: String,
      },
    ],
    markdownContent: {
      type: String,
      default: "",
    },
    isDetailed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const AiVideoStudyGuideSchema = new mongoose.Schema(
  {
    ytVideoId: {
      type: String,
      required: true,
      index: true,
    },
    videoTitle: {
      type: String,
      required: true,
      trim: true,
    },
    durationInSeconds: {
      type: Number,
      default: 0,
    },
    channelTitle: {
      type: String,
      default: "",
    },
    promptVersion: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: 3,
      index: true,
    },
    executiveOverview: {
      type: String,
      default: "",
    },
    roadmap: [RoadmapItemSchema],
    modules: [ModuleItemSchema],
    status: {
      type: String,
      enum: ["generating", "completed", "failed"],
      default: "completed",
    },
    hasTranscript: {
      type: Boolean,
      default: true,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    hasEmbeddings: {
      type: Boolean,
      default: false,
      index: true,
    },
    embeddingStatus: {
      type: String,
      enum: ["pending", "embedding", "done", "failed"],
      default: "pending",
      index: true,
    },
    embeddingProgress: {
      type: Number,
      default: 0,
    },
    embeddingVersion: {
      type: String,
      default: "text-embedding-004-v1",
    },
    lastEmbeddingError: {
      type: String,
      default: "",
    },
    hasDetailedNotes: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDetailed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: guarantees sub-5ms cache hits per video and prompt version
AiVideoStudyGuideSchema.index({ ytVideoId: 1, promptVersion: 1 }, { unique: true });

module.exports = mongoose.model("AiVideoStudyGuide", AiVideoStudyGuideSchema);
