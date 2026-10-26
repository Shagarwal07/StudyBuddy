/**
 * rkNotesHandler.js
 * Domain handler for RK Workspace, LearnStudio class notes, and curriculum inquiries
 * Delegates upstream to Universal Main Agent and synthesizes teacher PDF notes with Billu AI persona.
 */

const agentCore = require("../core/agentCore");
const { queryUniversalMainAgent } = require("../core/universalClient");
const { buildSystemInstruction } = require("../core/promptComposer");

/**
 * Handles student inquiries regarding RK Coaching notes, curriculum, or board syllabus
 */
async function handleRkNotesChat({
  message,
  history = [],
  rkContext = null,
  customApiKey = null,
}) {
  const cleanMsg = String(message || "").trim();

  // 1. Check Universal Main Agent for central RAG knowledge / teacher PDF notes
  const upstream = await queryUniversalMainAgent({
    query: cleanMsg,
    tenant: "studybuddy",
    targetSource: "rk_workspace_notes",
    metadata: {
      topic: rkContext?.topic,
      standard: rkContext?.standard,
      subject: rkContext?.subject,
    },
  });

  // 2. Build system instruction with central knowledge if available
  const systemInstruction = buildSystemInstruction({
    scope: "rk_notes",
    rkContext,
    externalKnowledge: upstream.available ? upstream.contextText : "",
  });

  return await agentCore.executeChat({
    message: cleanMsg,
    history,
    systemInstruction,
    customApiKey,
    fallbackGenerator: () =>
      "I am currently operating in standalone local mode. Central RK Coaching notes are temporarily offline, but I can assist with standard board and academic curriculum questions.",
  });
}

/**
 * Generates dynamic suggestions for RK notes inquiries
 */
async function handleRkNotesSuggestions({
  rkContext = null,
  history = [],
  customApiKey = null,
}) {
  const topic = rkContext?.topic || rkContext?.subject || "Curriculum";
  const prompt = `You are Billu AI academic tutor for RK Coaching students.
Topic: "${topic}"
Generate exactly 3 short, relevant academic questions or review topics.
Return ONLY a valid JSON array of 3 strings. No emojis.`;

  return await agentCore.generateSuggestions({
    prompt,
    customApiKey,
    fallbackSuggestions: [
      "Summarize the key formula and definitions",
      "What are the high-probability board exam questions?",
      "Explain the core concept step-by-step",
    ],
  });
}

module.exports = {
  handleRkNotesChat,
  handleRkNotesSuggestions,
};
