/**
 * agentCore.js
 * Central AI Execution Engine for Billu Sub-Agent
 * Unifies history normalization, Gemini invocation, fallback handling, emoji stripping, and DB caching helpers.
 */

const { generateContent } = require("../../../config/geminiClient");
const { safeParseAiJson } = require("../../../utils/aiJsonParser");

/**
 * Strips all unicode emojis from a string
 */
function stripEmojis(str = "") {
  if (typeof str !== "string") return "";
  return str
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ""
    )
    .replace(/[^\x00-\x7F]/g, (char) => (char.charCodeAt(0) > 255 ? "" : char))
    .trim();
}

/**
 * Normalizes multi-turn conversation history for Gemini API
 */
function normalizeHistory(history = [], maxTurns = 8) {
  const contents = [];
  if (!Array.isArray(history)) return contents;

  for (const item of history.slice(-maxTurns)) {
    const text = item.text || item.content || item.message;
    if (!text) continue;

    if (item.role === "user") {
      contents.push({ role: "user", parts: [{ text: String(text).trim() }] });
    } else if (item.role === "assistant" || item.role === "model") {
      contents.push({ role: "model", parts: [{ text: String(text).trim() }] });
    }
  }

  return contents;
}

/**
 * Checks if user message is explicitly demanding the full code solution
 */
function isAskingFullCode(message = "") {
  if (!message || typeof message !== "string") return false;
  const lower = message.trim().toLowerCase();
  return (
    /(?:give|show|provide|write|send|view)\s+(?:me\s+)?(?:the\s+)?(?:full\s+|complete\s+|optimal\s+)?(?:code|solution)/i.test(lower) ||
    lower === "show code" ||
    lower === "full code" ||
    lower === "solution" ||
    lower === "give code"
  );
}

/**
 * Formats a cached database solution for instant zero-quota delivery
 */
function formatCachedCode({ title, code, lang = "java", approachName = "Optimal", timeComplexity = "Optimal", spaceComplexity = "Optimal" }) {
  return `### Optimal Solution: ${title || "Problem"}\n\nHere is the stored solution from the database:\n\n\`\`\`${lang}\n${String(code).trim()}\n\`\`\`\n\n- Approach: ${approachName}\n- Time Complexity: ${timeComplexity}\n- Space Complexity: ${spaceComplexity}`;
}

/**
 * Central chat execution with multi-model fallback and error recovery
 */
async function executeChat(argsOrMessages, maybeSystemInstruction = "", maybeTemperature = 0.25) {
  let message, history, systemInstruction, customApiKey, temperature, maxOutputTokens, fallbackGenerator;

  if (Array.isArray(argsOrMessages)) {
    const lastMsg = argsOrMessages[argsOrMessages.length - 1];
    message = lastMsg?.content || lastMsg?.text || "";
    history = argsOrMessages.slice(0, -1);
    systemInstruction = maybeSystemInstruction || "";
    temperature = typeof maybeTemperature === "number" ? maybeTemperature : 0.25;
  } else {
    ({
      message,
      history = [],
      systemInstruction = "",
      customApiKey = null,
      temperature = 0.25,
      maxOutputTokens = 2500,
      fallbackGenerator = null,
    } = argsOrMessages || {});
  }

  const cleanMsg = String(message || "").trim();
  if (!cleanMsg) {
    throw new Error("Message cannot be empty.");
  }

  const contents = normalizeHistory(history);

  // Attach system instruction to user question so grounding rules and personas stay enforced
  const promptText = systemInstruction
    ? `${systemInstruction}\n\nUser Question: ${cleanMsg}`
    : cleanMsg;

  contents.push({
    role: "user",
    parts: [{ text: promptText }],
  });

  try {
    const result = await generateContent({
      contents,
      temperature,
      maxOutputTokens,
      customApiKey,
    });

    return stripEmojis(result.text);
  } catch (err) {
    console.warn("[AgentCore:executeChat] Gemini API failed, using fallback:", err.message);
    if (typeof fallbackGenerator === "function") {
      return fallbackGenerator(cleanMsg);
    }
    return (
      "I am currently operating in limited offline mode. " +
      "For this problem or topic, please review standard algorithmic patterns, verify your base cases, " +
      "and ensure constraints are respected."
    );
  }
}

/**
 * Central question suggestions generator
 */
async function generateSuggestions({
  prompt,
  customApiKey = null,
  fallbackSuggestions = [
    "What is the optimal time complexity?",
    "Give me a conceptual hint",
    "Walk through an example dry run",
  ],
}) {
  try {
    const result = await generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      temperature: 0.2,
      maxOutputTokens: 250,
      customApiKey,
    });

    const parsed = safeParseAiJson(result.text);
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return parsed.slice(0, 4).map((s) => stripEmojis(String(s)));
    }
  } catch (err) {
    console.warn("[AgentCore:generateSuggestions] Suggestion notice:", err.message);
  }

  return fallbackSuggestions;
}

module.exports = {
  stripEmojis,
  normalizeHistory,
  isAskingFullCode,
  formatCachedCode,
  executeChat,
  generateSuggestions,
};
