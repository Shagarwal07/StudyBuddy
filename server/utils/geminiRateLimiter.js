/**
 * geminiRateLimiter.js
 * Token bucket rate limiter & exponential backoff for Gemini API calls.
 * Enforces 50 requests per 60 seconds with 429 Retry-After handling.
 */

const MAX_TOKENS = 50;
const REFILL_INTERVAL_MS = 60000;

let tokens = MAX_TOKENS;
let lastRefill = Date.now();

function refillTokens() {
  const now = Date.now();
  const timePassed = now - lastRefill;
  if (timePassed >= REFILL_INTERVAL_MS) {
    tokens = MAX_TOKENS;
    lastRefill = now;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensures call respects rate limits before dispatching to Gemini API
 */
async function awaitRateLimit() {
  refillTokens();

  if (tokens <= 0) {
    const timeToWait = Math.max(1000, REFILL_INTERVAL_MS - (Date.now() - lastRefill));
    console.log(`[RateLimiter] Bucket exhausted. Waiting ${Math.ceil(timeToWait / 1000)}s for token refill...`);
    await sleep(timeToWait);
    tokens = MAX_TOKENS;
    lastRefill = Date.now();
  }

  tokens -= 1;
}

/**
 * Handles 429 backoff with Retry-After header or exponential backoff
 */
async function handleRateLimitError(err, attempt = 1) {
  const retryAfterHeader = err?.response?.headers?.["retry-after"];
  let waitMs = 2000;

  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds) && seconds > 0) {
      waitMs = seconds * 1000;
    }
  } else {
    // Exponential backoff: 2s, 4s, 8s, 16s...
    waitMs = Math.min(30000, Math.pow(2, attempt) * 1000);
  }

  console.warn(`[RateLimiter] 429 Rate Limit hit. Backing off for ${waitMs}ms (Attempt ${attempt})...`);
  await sleep(waitMs);
}

module.exports = {
  awaitRateLimit,
  handleRateLimitError,
  sleep,
};
