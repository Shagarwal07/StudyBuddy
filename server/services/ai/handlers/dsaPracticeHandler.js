/**
 * dsaPracticeHandler.js
 * Domain handler for DSA Problem doubts, Socratic mentoring, and zero-quota code lookups
 */

const ProblemSolution = require("../../../models/ProblemSolution");
const agentCore = require("../core/agentCore");
const { buildSystemInstruction } = require("../core/promptComposer");
const { buildSuggestionPrompt } = require("../../../prompts/billuChat.prompt");

/**
 * Generates local fallback response for DSA problems if LLM is unavailable
 */
function generateDsaFallback(cleanMsg, problemContext) {
  const pTitle = problemContext?.title || "this problem";
  return (
    `### Mentor Notice: Offline Mode\n\n` +
    `I am currently operating in limited offline mode for **${pTitle}**.\n\n` +
    `- **Step 1: Understand Constraints**: Check bounds of N. If $N \\le 10^5$, an $O(N)$ or $O(N \\log N)$ solution is required.\n` +
    `- **Step 2: Core Pattern**: Identify whether this maps to Two Pointers, Sliding Window, Monotonic Stack, or Hash Map.\n` +
    `- **Step 3: Base & Edge Cases**: Test with empty arrays, single elements, and duplicates.\n\n` +
    `Please try re-asking your question in a moment once the connection refreshes.`
  );
}

/**
 * Handles conversational chat grounded in a DSA practice problem
 */
async function handleDsaChat({ message, history = [], problemContext = null, customApiKey = null }) {
  const cleanMsg = String(message || "").trim();

  // 1. Zero-Quota DB Code Check: If student explicitly asks for full code
  if (agentCore.isAskingFullCode(cleanMsg) && problemContext?.title) {
    if (problemContext.existingCode && typeof problemContext.existingCode === "string") {
      return agentCore.formatCachedCode({
        title: problemContext.title,
        code: problemContext.existingCode,
        lang: problemContext.lang || "java",
        timeComplexity: problemContext.timeComplexity || "Optimal",
        spaceComplexity: problemContext.spaceComplexity || "Optimal",
      });
    }

    try {
      const slug = (problemContext.title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const cachedSol = await ProblemSolution.findOne({
        $or: [{ slug }, { key: slug }, { aliases: slug }],
      }).lean();

      const solCode =
        cachedSol?.approaches?.[0]?.code ||
        cachedSol?.defaultCode ||
        cachedSol?.approaches?.[0]?.codes?.java ||
        cachedSol?.approaches?.[0]?.codes?.cpp ||
        cachedSol?.approaches?.[0]?.codes?.python;

      if (cachedSol && solCode) {
        return agentCore.formatCachedCode({
          title: problemContext.title,
          code: solCode,
          lang: problemContext.lang || "java",
          approachName: cachedSol.approaches?.[0]?.name || "Optimal",
        });
      }
    } catch (dbErr) {
      console.warn("[DsaPracticeHandler] ProblemSolution DB lookup notice:", dbErr.message);
    }
  }

  // 2. Normal conversational turn with Billu persona
  const systemInstruction = buildSystemInstruction({
    scope: "dsa_practice",
    problemContext,
  });

  return await agentCore.executeChat({
    message: cleanMsg,
    history,
    systemInstruction,
    customApiKey,
    fallbackGenerator: (msg) => generateDsaFallback(msg, problemContext),
  });
}

/**
 * Generates dynamic 2-3 question suggestion chips
 */
async function handleDsaSuggestions({ problemContext = {}, history = [], customApiKey = null }) {
  const prompt = buildSuggestionPrompt({ problemContext, history });
  return await agentCore.generateSuggestions({
    prompt,
    customApiKey,
    fallbackSuggestions: [
      "What is the optimal time and space complexity?",
      "Give me a conceptual hint",
      "Walk through a dry run on an example",
    ],
  });
}

module.exports = {
  handleDsaChat,
  handleDsaSuggestions,
  // Aliases for compatibility
  chatWithBillu: handleDsaChat,
  suggestQuestions: handleDsaSuggestions,
};
