/**
 * embeddingService.js
 * Production-grade vector embedding, lazy parallel notes, and semantic search engine.
 *
 * Implements:
 * 1. Lazy global embedding with 10% partial early return
 * 2. Background continuation of full embedding (setImmediate)
 * 3. Distributed locking (protects against concurrent students opening same video)
 * 4. Batch API execution (gemini-embedding-001 with fallback models, 40 per call)
 * 5. Dynamic search limit: 8 chunks if video duration > 4hr, else 4 chunks
 * 6. Non-blocking parallel detailed notes synthesis (ensureVideoNotes)
 */

const axios = require("axios");
const { YoutubeTranscript } = require("youtube-transcript");
const TranscriptChunk = require("../../models/TranscriptChunk");
const Video = require("../../models/Video");
const AiVideoStudyGuide = require("../../models/AiVideoStudyGuide");
const { acquireLock, releaseLock, sleep } = require("../../utils/lockManager");
const { formatSeconds } = require("../../utils/formatTime");
const { awaitRateLimit, handleRateLimitError } = require("../../utils/geminiRateLimiter");
const { enqueueJob } = require("../queueService");

const CURRENT_VERSION = "text-embedding-004-v1";
const EMBEDDING_MODELS = [
  "gemini-embedding-001",
  "gemini-embedding-2",
  "gemini-embedding-2-preview",
  "text-embedding-004",
];

/**
 * Generates an embedding for a single text using Gemini Embedding API
 */
async function embedSingle(text, customApiKey = null) {
  const clean = String(text || "").trim();
  if (!clean) return new Array(768).fill(0);

  const activeKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  let lastErr = null;
  for (const model of EMBEDDING_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${activeKey}`;
      const payload = {
        model: `models/${model}`,
        content: { parts: [{ text: clean }] },
        outputDimensionality: 768,
      };

      const res = await axios.post(url, payload, { timeout: 30000 });
      const values = res.data?.embedding?.values;
      if (Array.isArray(values) && values.length === 768) {
        return values;
      }
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      if (status === 429 || err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED")) {
        await handleRateLimitError(err);
      }
    }
  }

  throw new Error(lastErr?.response?.data?.error?.message || lastErr?.message || "Failed to generate embedding.");
}

/**
 * Generates batch embeddings for up to 40 chunks per API call using batchEmbedContents
 */
async function batchEmbed(texts = [], customApiKey = null) {
  if (!texts.length) return [];
  const activeKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  for (const model of EMBEDDING_MODELS) {
    try {
      await awaitRateLimit();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${activeKey}`;
      const requests = texts.map((t) => ({
        model: `models/${model}`,
        content: { parts: [{ text: String(t).trim() }] },
        outputDimensionality: 768,
      }));

      const res = await axios.post(url, { requests }, { timeout: 60000 });
      const embeddings = res.data?.embeddings;
      if (Array.isArray(embeddings) && embeddings.length === texts.length) {
        return embeddings.map((e) => e.values);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 429) {
        await handleRateLimitError(err);
      }
    }
  }

  // Fallback to sequential single chunk embeds
  console.warn("[EmbeddingService] Batch embed fallback to single chunk embeds...");
  const results = [];
  for (const t of texts) {
    results.push(await embedSingle(t, customApiKey));
    await sleep(200);
  }
  return results;
}

/**
 * Calculates cosine similarity between two 768-dimensional vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Partitions raw transcript into 60s chunks with 10s overlap (step = 50s)
 */
function createTranscriptChunks(ytVideoId, rawTranscript = [], videoDuration = 0) {
  if (!rawTranscript.length) return [];

  const normalized = rawTranscript.map((item) => ({
    text: item.text || "",
    seconds: Math.floor((item.offset || 0) / 1000),
  }));

  const lastSecond = normalized[normalized.length - 1].seconds;
  const chunkWindow = 60;
  const step = 50; // 10s overlap
  const chunks = [];

  for (let start = 0; start <= lastSecond; start += step) {
    const end = start + chunkWindow;
    const itemsInWindow = normalized.filter(
      (item) => item.seconds >= start && item.seconds < end
    );

    const chunkText = itemsInWindow
      .map((item) => item.text.trim())
      .filter(Boolean)
      .join(" ");

    if (chunkText.length > 0) {
      chunks.push({
        ytVideoId,
        chunkId: `${ytVideoId}_${start}_${end}`,
        startSeconds: start,
        endSeconds: end,
        timeFormatted: `${formatSeconds(start)} - ${formatSeconds(end)}`,
        text: chunkText,
        embeddingVersion: CURRENT_VERSION,
        videoDuration: Number(videoDuration) || lastSecond || 0,
      });
    }
  }

  return chunks;
}

/**
 * Ensures vector embeddings are computed for a video.
 * Supports { allowPartial: true } to return early at 10% progress while continuing rest in background.
 */
async function ensureEmbeddings(ytVideoId, options = {}) {
  if (!ytVideoId) return { done: false, progress: 0, partial: false };

  let allowPartial = false;
  let customApiKey = null;
  if (typeof options === "object" && options !== null) {
    allowPartial = Boolean(options.allowPartial);
    customApiKey = options.customApiKey || null;
  } else if (typeof options === "string") {
    customApiKey = options;
  }

  // 1. Check if already done
  const [guide, video] = await Promise.all([
    AiVideoStudyGuide.findOne({ ytVideoId }).lean(),
    Video.findOne({ ytVideoId }).lean(),
  ]);

  if (
    (guide?.hasEmbeddings && guide?.embeddingStatus === "done") ||
    (video?.hasEmbeddings && video?.embeddingStatus === "done")
  ) {
    return { done: true, progress: 100, partial: false };
  }

  const existingCount = await TranscriptChunk.countDocuments({
    ytVideoId,
    embeddingVersion: CURRENT_VERSION,
  });

  if (existingCount > 0 && (guide?.embeddingStatus === "done" || video?.embeddingStatus === "done")) {
    return { done: true, progress: 100, partial: false };
  }

  // 2. Concurrency Lock: embed:lock:${ytVideoId}
  const lockKey = `embed:lock:${ytVideoId}`;
  const acquired = await acquireLock(lockKey, 300);

  if (!acquired) {
    console.log(`[EmbeddingService] Lock held for ${ytVideoId}, polling up to 90s for completion...`);
    const startTime = Date.now();
    while (Date.now() - startTime < 90000) {
      await sleep(2500);
      const [pollGuide, pollVideo] = await Promise.all([
        AiVideoStudyGuide.findOne({ ytVideoId }).lean(),
        Video.findOne({ ytVideoId }).lean(),
      ]);

      const isDone =
        (pollGuide?.hasEmbeddings && pollGuide?.embeddingStatus === "done") ||
        (pollVideo?.hasEmbeddings && pollVideo?.embeddingStatus === "done");

      if (isDone) {
        return { done: true, progress: 100, partial: false };
      }

      const curProg = pollGuide?.embeddingProgress ?? pollVideo?.embeddingProgress ?? 0;
      if (allowPartial && curProg >= 10) {
        return {
          done: false,
          progress: curProg,
          partial: true,
          chunksSoFar: await TranscriptChunk.countDocuments({ ytVideoId }),
        };
      }
    }
    return { done: false, progress: 0, partial: false };
  }

  try {
    // 3. Double-check status after acquiring lock
    const doubleCheck = await TranscriptChunk.countDocuments({
      ytVideoId,
      embeddingVersion: CURRENT_VERSION,
    });
    if (doubleCheck > 0 && guide?.embeddingStatus === "done") {
      await releaseLock(lockKey);
      return { done: true, progress: 100, partial: false };
    }

    // 4. Update status to "embedding"
    await Promise.all([
      Video.updateMany(
        { ytVideoId },
        { $set: { embeddingStatus: "embedding", embeddingProgress: 5, lastEmbeddingError: "" } }
      ),
      AiVideoStudyGuide.updateMany(
        { ytVideoId },
        { $set: { embeddingStatus: "embedding", embeddingProgress: 5, lastEmbeddingError: "" } }
      ),
    ]);

    // 5. Fetch transcript
    console.log(`[EmbeddingService] Fetching transcript for ${ytVideoId}...`);
    let raw = [];
    try {
      raw = await YoutubeTranscript.fetchTranscript(ytVideoId);
    } catch (fetchErr) {
      console.warn(`[EmbeddingService] Transcript fetch notice for ${ytVideoId}:`, fetchErr.message);
      raw = [];
    }

    if (!Array.isArray(raw) || raw.length === 0) {
      await Promise.all([
        Video.updateMany(
          { ytVideoId },
          { $set: { hasEmbeddings: false, embeddingStatus: "done", embeddingProgress: 100 } }
        ),
        AiVideoStudyGuide.updateMany(
          { ytVideoId },
          { $set: { hasEmbeddings: false, embeddingStatus: "done", embeddingProgress: 100 } }
        ),
      ]);
      await releaseLock(lockKey);
      return { done: true, progress: 100, partial: false };
    }

    // 6. Chunk 60s with 10s overlap
    const duration = video?.videoDuration || video?.durationInSeconds || guide?.durationInSeconds || 0;
    const chunks = createTranscriptChunks(ytVideoId, raw, duration);
    if (!chunks.length) {
      await releaseLock(lockKey);
      return { done: true, progress: 100, partial: false };
    }

    console.log(`[EmbeddingService] Partitioned ${ytVideoId} into ${chunks.length} chunks. Batch embedding...`);

    const batchSize = 40;
    let embeddedCount = 0;
    let partialReturned = false;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const slice = chunks.slice(i, i + batchSize);
      const texts = slice.map((c) => c.text);
      const vectors = await batchEmbed(texts, customApiKey);

      for (let j = 0; j < slice.length; j++) {
        slice[j].embedding = vectors[j] || new Array(768).fill(0);
      }

      try {
        await TranscriptChunk.insertMany(slice, { ordered: false });
      } catch (insertErr) {
        // Ignore duplicate key errors if some chunks were previously inserted
      }

      embeddedCount += slice.length;
      const progress = Math.min(100, Math.floor((embeddedCount / chunks.length) * 100));

      await Promise.all([
        Video.updateMany({ ytVideoId }, { $set: { embeddingProgress: progress } }),
        AiVideoStudyGuide.updateMany({ ytVideoId }, { $set: { embeddingProgress: progress } }),
      ]);

      // 7. Check if 10% partial return is requested on first encounter
      if (allowPartial && (progress >= 10 || embeddedCount >= batchSize) && !partialReturned && i + batchSize < chunks.length) {
        partialReturned = true;
        const reportedProgress = Math.max(10, progress);
        console.log(`[EmbeddingService] 10% partial threshold reached (${reportedProgress}%). Returning early, continuing rest in background.`);

        // Persistent queue backup (survives server restart)
        const remainingChunks = chunks.slice(i + batchSize);
        await enqueueJob({
          ytVideoId,
          type: "embedding",
          remainingChunks,
          totalChunks: chunks.length,
          currentProgress: reportedProgress,
        }).catch((qErr) => console.warn("[EmbeddingService] enqueueJob notice:", qErr.message));

        // Continue remaining chunks in background via setImmediate
        setImmediate(async () => {
          try {
            for (let b = i + batchSize; b < chunks.length; b += batchSize) {
              await awaitRateLimit();
              const bgSlice = chunks.slice(b, b + batchSize);
              const bgTexts = bgSlice.map((c) => c.text);
              const bgVectors = await batchEmbed(bgTexts, customApiKey);

              for (let k = 0; k < bgSlice.length; k++) {
                bgSlice[k].embedding = bgVectors[k] || new Array(768).fill(0);
              }

              try {
                await TranscriptChunk.insertMany(bgSlice, { ordered: false });
              } catch {
                // Ignore duplicates
              }

              embeddedCount += bgSlice.length;
              const bgProgress = Math.min(100, Math.floor((embeddedCount / chunks.length) * 100));

              await Promise.all([
                Video.updateMany({ ytVideoId }, { $set: { embeddingProgress: bgProgress } }),
                AiVideoStudyGuide.updateMany({ ytVideoId }, { $set: { embeddingProgress: bgProgress } }),
              ]);

              await sleep(400);
            }

            // Mark 100% complete
            await Promise.all([
              Video.updateMany(
                { ytVideoId },
                { $set: { hasEmbeddings: true, embeddingStatus: "done", embeddingProgress: 100, embeddingVersion: CURRENT_VERSION } }
              ),
              AiVideoStudyGuide.updateMany(
                { ytVideoId },
                { $set: { hasEmbeddings: true, embeddingStatus: "done", embeddingProgress: 100, embeddingVersion: CURRENT_VERSION } }
              ),
            ]);
            console.log(`[EmbeddingService] Background full indexing finished 100% for ${ytVideoId}.`);
          } catch (bgErr) {
            console.error(`[EmbeddingService] Background indexing error for ${ytVideoId}:`, bgErr.message);
            await Video.updateMany({ ytVideoId }, { $set: { embeddingStatus: "failed", lastEmbeddingError: bgErr.message } });
          } finally {
            await releaseLock(lockKey);
          }
        });

        return {
          done: false,
          progress: reportedProgress,
          partial: true,
          chunksSoFar: embeddedCount,
        };
      }

      if (i + batchSize < chunks.length) {
        await sleep(400);
      }
    }

    // 8. If completed full synchronous pass
    await Promise.all([
      Video.updateMany(
        { ytVideoId },
        { $set: { hasEmbeddings: true, embeddingStatus: "done", embeddingProgress: 100, embeddingVersion: CURRENT_VERSION } }
      ),
      AiVideoStudyGuide.updateMany(
        { ytVideoId },
        { $set: { hasEmbeddings: true, embeddingStatus: "done", embeddingProgress: 100, embeddingVersion: CURRENT_VERSION } }
      ),
    ]);

    await releaseLock(lockKey);
    return { done: true, progress: 100, partial: false };
  } catch (err) {
    console.error(`[EmbeddingService] Error embedding ${ytVideoId}:`, err.message);
    await Promise.all([
      Video.updateMany({ ytVideoId }, { $set: { embeddingStatus: "failed", lastEmbeddingError: err.message } }),
      AiVideoStudyGuide.updateMany({ ytVideoId }, { $set: { embeddingStatus: "failed", lastEmbeddingError: err.message } }),
    ]);
    await releaseLock(lockKey);
    return { done: false, progress: 0, partial: false, error: err.message };
  }
}

/**
 * Searches relevant chunks (works even on partial collection).
 * Returns limit 8 if duration > 4hr, else 4.
 */
async function searchRelevantChunks(ytVideoId, question, currentTs = 0, customApiKey = null) {
  if (!ytVideoId || !question) return [];

  let queryVector;
  try {
    queryVector = await embedSingle(question, customApiKey);
  } catch (embedErr) {
    console.warn(`[EmbeddingService] Query embedding notice:`, embedErr.message);
    return [];
  }

  // Determine limit based on video duration: > 4hr (14400s) => limit 8, else 4
  let duration = 0;
  const chunkDoc = await TranscriptChunk.findOne({ ytVideoId }).select("videoDuration").lean();
  if (chunkDoc?.videoDuration) {
    duration = chunkDoc.videoDuration;
  } else {
    const videoDoc = await Video.findOne({ ytVideoId }).select("durationInSeconds videoDuration").lean();
    duration = videoDoc?.videoDuration || videoDoc?.durationInSeconds || 0;
  }
  const resultLimit = duration > 14400 ? 8 : 4;

  let candidates = [];

  // 1. Attempt Atlas $vectorSearch
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 50,
          limit: 15,
          filter: {
            ytVideoId: { $eq: ytVideoId },
          },
        },
      },
      {
        $project: {
          _id: 1,
          ytVideoId: 1,
          chunkId: 1,
          startSeconds: 1,
          endSeconds: 1,
          timeFormatted: 1,
          text: 1,
          semanticScore: { $meta: "vectorSearchScore" },
        },
      },
    ];

    candidates = await TranscriptChunk.aggregate(pipeline);
  } catch (atlasErr) {
    candidates = [];
  }

  // 2. Fallback to in-memory cosine similarity if Atlas Vector Index is not yet active
  if (!Array.isArray(candidates) || candidates.length === 0) {
    const localChunks = await TranscriptChunk.find({ ytVideoId }).lean();
    if (localChunks.length > 0) {
      candidates = localChunks
        .map((c) => ({
          ...c,
          semanticScore: cosineSimilarity(queryVector, c.embedding),
        }))
        .sort((a, b) => b.semanticScore - a.semanticScore)
        .slice(0, 15);
    }
  }

  if (!candidates.length) return [];

  // 3. Add time proximity score: 1 / (1 + abs(startSeconds - currentTs) / 60)
  const scored = candidates.map((chunk) => {
    const timeScore = 1 / (1 + Math.abs((chunk.startSeconds || 0) - currentTs) / 60);
    const semantic = typeof chunk.semanticScore === "number" ? chunk.semanticScore : 0.5;
    const combinedScore = semantic * 0.7 + timeScore * 0.3;

    return {
      ...chunk,
      timeScore,
      combinedScore,
    };
  });

  // 4. Sort by combined score descending and return resultLimit
  scored.sort((a, b) => b.combinedScore - a.combinedScore);
  return scored.slice(0, resultLimit);
}

/**
 * Ensures detailed chapter notes (Phase 2) exist for this video.
 * Runs non-blocking in background.
 */
async function ensureVideoNotes(ytVideoId, customApiKey = null) {
  if (!ytVideoId) return false;

  const guide = await AiVideoStudyGuide.findOne({ ytVideoId }).lean();
  if (guide?.hasDetailedNotes && guide?.isDetailed) return true;

  // Synthesize keyInsights for chapters in roadmap non-blocking
  try {
    const notesService = require("./notesService");
    const roadmap = guide?.roadmap || [];
    const countToGenerate = Math.min(roadmap.length, 3);
    for (let idx = 0; idx < countToGenerate; idx++) {
      await notesService.generateModuleDeepNotes({ ytVideoId, moduleIndex: idx, customApiKey }).catch(() => {});
    }

    const isAllSynthesized = roadmap.length <= 3;
    await Promise.all([
      AiVideoStudyGuide.updateOne(
        { ytVideoId },
        {
          $set: {
            hasDetailedNotes: true,
            isDetailed: isAllSynthesized,
            notesProgress: isAllSynthesized ? 100 : Math.round((countToGenerate / (roadmap.length || 1)) * 100),
          },
        }
      ),
      Video.updateMany(
        { ytVideoId },
        { $set: { hasDetailedNotes: true, isDetailed: isAllSynthesized } }
      ),
    ]);
    return true;
  } catch (err) {
    console.warn(`[EmbeddingService] ensureVideoNotes notice for ${ytVideoId}:`, err.message);
    return false;
  }
}

/**
 * Hourly retry helper for failed video embeddings
 */
async function retryFailedEmbeddings() {
  try {
    const failedGuides = await AiVideoStudyGuide.find({ embeddingStatus: "failed" }).limit(10);
    for (const guide of failedGuides) {
      console.log(`[EmbeddingService] Retrying failed embeddings for ${guide.ytVideoId}...`);
      await ensureEmbeddings(guide.ytVideoId);
      await sleep(1000);
    }
  } catch (err) {
    console.warn("[EmbeddingService] retryFailedEmbeddings notice:", err.message);
  }
}

module.exports = {
  CURRENT_VERSION,
  embedSingle,
  batchEmbed,
  ensureEmbeddings,
  searchRelevantChunks,
  ensureVideoNotes,
  retryFailedEmbeddings,
  cosineSimilarity,
};
