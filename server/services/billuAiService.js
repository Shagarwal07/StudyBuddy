/**
 * Billu AI Service - Unified Sub-Agent Facade
 *
 * Exposes a consolidated interface for all AI operations:
 * 1. Conversational Chat (DSA Mentor, YouTube Lecture Doubts, RK Notes)
 * 2. Standalone Competitive Programming Code Gen (3-tier tabs)
 * 3. Official LeetCode Runner Harness Gen (Full Code)
 * 4. Syllabus / Document Scanning & DSA Curriculum Categorization
 * 5. Video Study Guide Roadmap & Module Synthesis
 * 6. Single-Dispatch Agent Gateway: `dispatchAgent`
 */

const aiModule = require("./ai");
const { handleDsaChat, handleDsaSuggestions } = require("./ai/handlers/dsaPracticeHandler");
const { handleYouTubeChat, handleYouTubeSuggestions } = require("./ai/handlers/youtubeVideoHandler");
const { handleRkNotesChat, handleRkNotesSuggestions } = require("./ai/handlers/rkNotesHandler");
const { generateStandaloneSolution, generateOfficialHarnessSolution, CODEGEN_PROMPT_VERSION } = require("./ai/handlers/codeGenHandler");
const { scanSheetWithGemini, categorizeProblemsWithGemini, SHEET_PARSER_PROMPT_VERSION } = require("./ai/handlers/sheetParserHandler");
const { getOrGenerateStudyGuide, generateModuleDeepNotes, NOTES_PROMPT_VERSION } = require("./ai/notesService");

const CHAT_PROMPT_VERSION = "v2_no_emoji";
const YOUTUBE_DOUBT_PROMPT_VERSION = "v1_youtube_tutor";

module.exports = {
  // Unified Agent Gateway
  dispatch: aiModule.dispatch,
  dispatchAgent: aiModule.dispatch,

  // 1. Practice & DSA Chat
  chatWithBillu: handleDsaChat,
  suggestQuestions: handleDsaSuggestions,
  CHAT_PROMPT_VERSION,

  // 2. YouTube Lecture Doubts
  chatWithYouTubeBillu: handleYouTubeChat,
  suggestYouTubeQuestions: handleYouTubeSuggestions,
  chatWithVideoBillu: handleYouTubeChat,
  suggestVideoQuestions: handleYouTubeSuggestions,
  YOUTUBE_DOUBT_PROMPT_VERSION,

  // 3. RK Notes & Central Knowledge
  chatWithRkNotes: handleRkNotesChat,
  suggestRkQuestions: handleRkNotesSuggestions,

  // 4. Code Generation
  generateStandaloneSolution,
  generateOfficialHarnessSolution,
  CODEGEN_PROMPT_VERSION,
  PROMPT_VERSION: CODEGEN_PROMPT_VERSION,

  // 5. Document / Sheet Parsing & Categorization
  scanSheetWithGemini,
  categorizeProblemsWithGemini,
  scanSheet: scanSheetWithGemini,
  categorizeProblems: categorizeProblemsWithGemini,
  SHEET_PARSER_PROMPT_VERSION,

  // 6. Video Study Guide Synthesis
  getOrGenerateStudyGuide,
  generateModuleDeepNotes,
  NOTES_PROMPT_VERSION,
};
