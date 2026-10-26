/**
 * queueService.js
 * Persistent MongoDB-backed JobQueue for long-running video indexing & notes synthesis.
 * Survives server restarts and continues 8-hour lecture indexing reliably.
 */

const mongoose = require("mongoose");
const Video = require("../models/Video");
const AiVideoStudyGuide = require("../models/AiVideoStudyGuide");
const TranscriptChunk = require("../models/TranscriptChunk");
const { awaitRateLimit, handleRateLimitError } = require("../utils/geminiRateLimiter");

const JobQueueSchema = new mongoose.Schema(
  {
    ytVideoId: { type: String, required: true, index: true },
    type: { type: String, enum: ["embedding", "notes"], default: "embedding" },
    status: {
      type: String,
      enum: ["pending", "processing", "done", "failed"],
      default: "pending",
      index: true,
    },
    progress: { type: Number, default: 0 },
    remainingChunks: { type: Array, default: [] },
    totalChunks: { type: Number, default: 0 },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

let JobQueue;
try {
  JobQueue = mongoose.model("JobQueue");
} catch {
  JobQueue = mongoose.model("JobQueue", JobQueueSchema);
}

let isWorkerActive = false;

/**
 * Enqueue remaining chunks for background processing
 */
async function enqueueJob({ ytVideoId, type = "embedding", remainingChunks = [], totalChunks = 0, currentProgress = 10 }) {
  if (!ytVideoId) return null;
  const doc = await JobQueue.findOneAndUpdate(
    { ytVideoId, type },
    {
      $set: {
        status: "pending",
        remainingChunks,
        totalChunks: totalChunks || remainingChunks.length,
        progress: currentProgress,
        error: "",
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  setImmediate(() => {
    processPendingJobs().catch((err) => console.warn("[QueueService] Background runner error:", err.message));
  });

  return doc;
}

/**
 * Worker to process pending jobs on boot or trigger
 */
async function processPendingJobs() {
  if (isWorkerActive) return;
  isWorkerActive = true;
  try {
    const pendingJobs = await JobQueue.find({ status: { $in: ["pending", "processing"] } }).limit(5);
    if (!pendingJobs.length) return;

    const { batchEmbed } = require("./ai/embeddingService");

    for (const job of pendingJobs) {
      console.log(`[QueueService] Resuming persistent job for ${job.ytVideoId} (${job.remainingChunks?.length || 0} chunks left)...`);
      await JobQueue.updateOne({ _id: job._id }, { $set: { status: "processing" } });

      const chunks = job.remainingChunks || [];
      const batchSize = 40;
      let processed = job.totalChunks - chunks.length;

      try {
        while (chunks.length > 0) {
          const slice = chunks.splice(0, batchSize);
          const texts = slice.map((c) => c.text);

          await awaitRateLimit();
          const vectors = await batchEmbed(texts);

          for (let j = 0; j < slice.length; j++) {
            slice[j].embedding = vectors[j] || new Array(768).fill(0);
          }

          try {
            await TranscriptChunk.insertMany(slice, { ordered: false });
          } catch {
            // Duplicate chunk tolerance
          }

          processed += slice.length;
          const prog = Math.min(100, Math.floor((processed / job.totalChunks) * 100));

          await Promise.all([
            JobQueue.updateOne({ _id: job._id }, { $set: { remainingChunks: chunks, progress: prog } }),
            Video.updateMany({ ytVideoId: job.ytVideoId }, { $set: { embeddingProgress: prog } }),
            AiVideoStudyGuide.updateMany({ ytVideoId: job.ytVideoId }, { $set: { embeddingProgress: prog } }),
          ]);
        }

        // Complete job
        await Promise.all([
          JobQueue.updateOne({ _id: job._id }, { $set: { status: "done", progress: 100 } }),
          Video.updateMany(
            { ytVideoId: job.ytVideoId },
            { $set: { hasEmbeddings: true, embeddingStatus: "done", embeddingProgress: 100, lockAt: null } }
          ),
          AiVideoStudyGuide.updateMany(
            { ytVideoId: job.ytVideoId },
            { $set: { hasEmbeddings: true, embeddingStatus: "done", embeddingProgress: 100 } }
          ),
        ]);

        console.log(`[QueueService] Successfully completed persistent job for ${job.ytVideoId}!`);
      } catch (jobErr) {
        console.error(`[QueueService] Persistent job failed for ${job.ytVideoId}:`, jobErr.message);
        await JobQueue.updateOne({ _id: job._id }, { $set: { status: "failed", error: jobErr.message } });
      }
    }
  } catch (err) {
    console.warn("[QueueService] processPendingJobs notice:", err.message);
  } finally {
    isWorkerActive = false;
  }
}

module.exports = {
  JobQueue,
  enqueueJob,
  processPendingJobs,
};
