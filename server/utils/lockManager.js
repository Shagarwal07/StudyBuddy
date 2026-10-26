/**
 * lockManager.js
 * Atomic MongoDB locking with zero Redis dependency.
 * Protects expensive vector embeddings and LLM synthesis from concurrent student requests.
 */

const Video = require("../models/Video");
const { sleep } = require("./geminiRateLimiter");

function extractVideoId(key) {
  if (!key) return "";
  const str = String(key).trim();
  const match = str.match(/(?:embed:lock:|gen:|guide:)([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1].split("_")[0];
  }
  return str.replace(/^[^:]+:/, "").split("_")[0];
}

/**
 * Attempts to atomically acquire a lock.
 * Uses atomic findOneAndUpdate with lockAt timestamp check.
 */
async function acquireLock(key, ttlSeconds = 300) {
  const ytVideoId = extractVideoId(key);
  const expiryThreshold = new Date(Date.now() - ttlSeconds * 1000);
  const isEmbedLock = String(key || "").startsWith("embed:lock:");

  if (ytVideoId) {
    try {
      const updateDoc = {
        $set: {
          lockAt: new Date(),
          ...(isEmbedLock ? { embeddingStatus: "embedding" } : {}),
        },
      };

      const locked = await Video.findOneAndUpdate(
        {
          ytVideoId,
          $or: [
            ...(isEmbedLock ? [{ embeddingStatus: { $ne: "embedding" } }] : []),
            { lockAt: { $lt: expiryThreshold } },
            { lockAt: { $exists: false } },
            { lockAt: null },
          ],
        },
        updateDoc,
        { returnDocument: "after" }
      );
      if (locked) return true;
      return false;
    } catch (err) {
      console.warn("[LockManager] Mongo atomic acquireLock notice:", err.message);
      return true; // Fail-open to avoid permanent deadlock
    }
  }

  return true;
}

/**
 * Releases a held lock
 */
async function releaseLock(key) {
  const ytVideoId = extractVideoId(key);
  if (ytVideoId) {
    try {
      await Video.updateMany(
        { ytVideoId },
        { $unset: { lockAt: 1 } }
      );
    } catch (err) {
      console.warn("[LockManager] Mongo releaseLock notice:", err.message);
    }
  }
}

module.exports = {
  acquireLock,
  releaseLock,
  sleep,
};
