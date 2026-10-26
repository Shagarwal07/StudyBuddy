/**
 * promptComposer.js
 * Composable dynamic prompt builder for Billu AI Sub-Agent
 * Enforces zero-emoji, professional academic tone, and injects context-specific blocks.
 */

const BASE_BILLU_PERSONA = `You are Billu AI, the expert technical mentor and academic professor at StudyBuddy.
Your mission is to guide students, developers, and engineers to master Computer Science, Data Structures & Algorithms, System Design, Engineering, and Academic Subjects.

CORE RULES:
1. NEVER USE EMOJIS: Do not include any emojis anywhere in your responses under any circumstances. Maintain a sleek, modern, professional engineering and academic tone.
2. PEDAGOGICAL PROGRESSION:
   - When asked for hints, do not dump the full solution code immediately. Provide intuitive nudges, pattern recognition, or edge-case questions first.
   - If the student explicitly asks for full code, provide clean, production-grade, syntax-highlighted code with exact time and space complexity analysis.
3. DRY-RUN TABLES & FORMATTING:
   - When explaining step-by-step algorithms, use Markdown tables with columns for variables, indices, conditions, and actions.
   - For mathematical equations, use standard LaTeX ($...$ inline, $$...$$ block).
4. COMPLEXITY PRECISION:
   - Always state Big-O Time Complexity and Space Complexity with clear justification.`;

/**
 * Format DSA problem context header
 */
function formatProblemContext(problem) {
  if (!problem || !problem.title) return "";
  return `ACTIVE PROBLEM CONTEXT:
- Problem: ${problem.title}${problem.number ? ` (#${problem.number})` : ""}
- Difficulty: ${problem.difficulty || "Unspecified"}
- Topic: ${problem.topic || "General DSA"}
- Platform: ${problem.platform || "LeetCode"}
${problem.description ? `- Description/Summary: ${String(problem.description).slice(0, 1000)}` : ""}`;
}

/**
 * Format YouTube video lecture context header
 */
function formatYouTubeContext(youtube) {
  if (!youtube || (!youtube.videoTitle && !youtube.title)) return "";
  const vTitle = youtube.videoTitle || youtube.title || "Lecture";
  const pTitle = youtube.playlistTitle || youtube.courseTitle || "";
  const time = youtube.timestamp || "";
  const chapter = youtube.chapterTopic || youtube.activeChapter || "";
  const desc = youtube.description ? String(youtube.description).slice(0, 800) : "";

  return `ACTIVE YOUTUBE LECTURE CONTEXT:
- Video Title: ${vTitle}
${pTitle ? `- Course/Playlist: ${pTitle}` : ""}
${time ? `- Current Playback Timestamp: ${time}` : ""}
${chapter ? `- Active Chapter/Topic: ${chapter}` : ""}
${desc ? `- Video Overview: ${desc}` : ""}`;
}

/**
 * Format RK notes / central knowledge context header
 */
function formatRkContext(rkContext, externalKnowledge = "") {
  let header = "";
  if (rkContext) {
    header += `ACTIVE RK COACHING CONTEXT:
- Topic/Class: ${rkContext.topic || rkContext.subject || "General Academic"}
${rkContext.standard ? `- Class/Grade: ${rkContext.standard}` : ""}\n`;
  }
  if (externalKnowledge) {
    header += `OFFICIAL TEACHER NOTES (from Central Knowledge Base):\n${externalKnowledge}\n`;
  }
  return header;
}

/**
 * Builds system instruction based on scope
 */
function buildSystemInstruction({ scope = "dsa_practice", problemContext, youtubeContext, rkContext, externalKnowledge }) {
  let contextBlock = "";

  if (scope === "dsa_practice" || problemContext) {
    contextBlock = formatProblemContext(problemContext);
  } else if (scope === "youtube" || youtubeContext) {
    contextBlock = formatYouTubeContext(youtubeContext);
  } else if (scope === "rk_notes" || rkContext || externalKnowledge) {
    contextBlock = formatRkContext(rkContext, externalKnowledge);
  }

  return contextBlock
    ? `${BASE_BILLU_PERSONA}\n\n${contextBlock}`
    : BASE_BILLU_PERSONA;
}

module.exports = {
  BASE_BILLU_PERSONA,
  formatProblemContext,
  formatYouTubeContext,
  formatRkContext,
  buildSystemInstruction,
};
