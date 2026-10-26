const axios = require("axios");

const { awaitRateLimit, handleRateLimitError, sleep } = require("../utils/geminiRateLimiter");

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
];

/**
 * Low-level Gemini generateContent caller with candidate model fallback
 */
async function generateContent({
  contents,
  temperature = 0.2,
  maxOutputTokens = 8192,
  responseMimeType = null,
  generationConfig = {},
  customApiKey = null,
  timeout = 60000,
}) {
  const activeKey = customApiKey || process.env.GEMINI_API_KEY;

  if (!activeKey || activeKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const payload = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(responseMimeType ? { response_mime_type: responseMimeType } : {}),
      ...generationConfig,
    },
  };

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      await awaitRateLimit();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`;
      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout,
      });

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return {
          text: reply.trim(),
          modelUsed: model,
          candidates: response.data?.candidates,
        };
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`[GeminiClient] Model ${model} failed (${status}):`, errMsg);

      // If invalid key or access denied, don't waste time trying fallback models
      if (status === 400 || status === 403) {
        throw new Error(errMsg || "Invalid Gemini API key or request error.");
      }

      // If transient spike (503 or 429), trigger exponential backoff through central limiter
      if (status === 503 || status === 429) {
        await handleRateLimitError(err);
      }
    }
  }

  throw new Error(
    lastError?.response?.data?.error?.message ||
    lastError?.message ||
    "All models were unavailable or busy. Please try again shortly."
  );
}

module.exports = {
  CANDIDATE_MODELS,
  generateContent,
};
