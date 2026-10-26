const CHAT_PROMPT_VERSION = "v2_no_emoji";

const BILLU_SYSTEM_PROMPT = `You are Billu AI, the expert technical mentor and computer science professor at StudyBuddy.
Your mission is to guide students, developers, and aspiring software engineers to master Data Structures, Algorithms, System Design, and Technical Interviews.

CORE RULES:
1. NEVER USE EMOJIS: Do not include any emojis anywhere in your responses under any circumstances. Maintain a sleek, modern, professional engineering tone.
2. PEDAGOGICAL PROGRESSION:
   - When asked for hints, do not dump the full solution code immediately. Provide intuitive nudges, pattern recognition, or edge-case questions first.
   - If the student explicitly asks for the full code, provide clean, production-grade, syntax-highlighted code with exact time and space complexity analysis.
3. DRY-RUN EXECUTION TABLES:
   - When explaining an algorithm or dry-running an example, use Markdown tables with columns for variables, indices, conditions, and explanations (e.g. | Step | i | nums[i] | State | Action |).
4. COMPLEXITY PRECISION:
   - Always state Big-O Time Complexity and Space Complexity with mathematical justification.
5. CODE CONVENTIONS:
   - For LeetCode problems: use standard "class Solution" and standard method signatures.
   - For Competitive Programming: provide fast I/O and standard main() structure.`;

/**
 * Builds chat contents for Gemini multi-turn conversation with optional problem grounding
 */
function buildChatContents({ message, history = [], problemContext = null }) {
  const contents = [];

  // Build problem grounding context block if present
  let contextHeader = "";
  if (problemContext && problemContext.title) {
    contextHeader = `ACTIVE PROBLEM CONTEXT:
- Problem: ${problemContext.title}${problemContext.number ? ` (#${problemContext.number})` : ""}
- Difficulty: ${problemContext.difficulty || "Unspecified"}
- Topic: ${problemContext.topic || "General DSA"}
- Platform: ${problemContext.platform || "LeetCode"}
${problemContext.description ? `- Description/Summary: ${problemContext.description.slice(0, 1000)}` : ""}`;
  }

  // Inject system persona into the initial turn
  const systemInstruction = contextHeader
    ? `${BILLU_SYSTEM_PROMPT}\n\n${contextHeader}`
    : BILLU_SYSTEM_PROMPT;

  // Add conversation history
  if (Array.isArray(history)) {
    for (const h of history.slice(-8)) {
      if (h.role === "user" && h.text) {
        contents.push({ role: "user", parts: [{ text: h.text }] });
      } else if (h.role === "assistant" && h.text) {
        contents.push({ role: "model", parts: [{ text: h.text }] });
      }
    }
  }

  const promptText = contents.length === 0
    ? `${systemInstruction}\n\nUser Question: ${message.trim()}`
    : `[System Reminder: You are Billu AI. Never use emojis. Maintain professional engineering tone.]\n\n${message.trim()}`;

  contents.push({
    role: "user",
    parts: [{ text: promptText }],
  });

  return contents;
}

/**
 * Builds prompt for dynamic 2-3 question suggestions based on conversation state
 */
function buildSuggestionPrompt({ problemContext = {}, history = [] }) {
  const recentHistory = (history || [])
    .slice(-4)
    .map((h) => `${h.role === "user" ? "Student" : "Mentor"}: ${h.text?.slice(0, 150)}`)
    .join("\n");

  return `You are Billu AI technical mentor at StudyBuddy.
Based on this problem and recent conversation, predict 3 high-impact follow-up questions or next steps the student should explore next.

PROBLEM:
- Title: "${problemContext.title || "DSA Problem"}"
- Topic: "${problemContext.topic || "Algorithms"}"
- Difficulty: "${problemContext.difficulty || "Medium"}"

RECENT DISCUSSION:
${recentHistory || "Student just started viewing the problem."}

RULES:
1. Do NOT use emojis.
2. Return ONLY a valid JSON array of 3 short strings (max 8 words each).
Example:
[
  "What is the optimal time complexity?",
  "How can we solve this in O(1) space?",
  "Walk through a dry run on an edge case"
]`;
}

module.exports = {
  CHAT_PROMPT_VERSION,
  PROMPT_VERSION: CHAT_PROMPT_VERSION,
  BILLU_SYSTEM_PROMPT,
  buildChatContents,
  buildSuggestionPrompt,
};
