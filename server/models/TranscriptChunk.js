const mongoose = require("mongoose");

const TranscriptChunkSchema = new mongoose.Schema(
  {
    ytVideoId: {
      type: String,
      required: true,
      index: true,
    },
    chunkId: {
      type: String,
      required: true,
      unique: true, // ${ytVideoId}_${start}_${end}
      index: true,
    },
    startSeconds: {
      type: Number,
      required: true,
    },
    endSeconds: {
      type: Number,
      required: true,
    },
    timeFormatted: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 768,
        message: "Embedding must have exactly 768 dimensions.",
      },
    },
    embeddingVersion: {
      type: String,
      default: "text-embedding-004-v1",
      index: true,
    },
    videoDuration: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

TranscriptChunkSchema.index({ ytVideoId: 1, startSeconds: 1 });

module.exports = mongoose.model("TranscriptChunk", TranscriptChunkSchema);
