/**
 * index.js
 * Billu AI Sub-Agent Unified Entrypoint & Orchestrator
 *
 * Exposes a single `dispatch` method for unified agent requests,
 * as well as direct exports for domain handlers.
 */

const { handleDsaChat, handleDsaSuggestions } = require("./handlers/dsaPracticeHandler");
const { handleYouTubeChat, handleYouTubeSuggestions } = require("./handlers/youtubeVideoHandler");
const { handleRkNotesChat, handleRkNotesSuggestions } = require("./handlers/rkNotesHandler");
const { generateStandaloneSolution, generateOfficialHarnessSolution } = require("./handlers/codeGenHandler");
const { scanSheetWithGemini, categorizeProblemsWithGemini } = require("./handlers/sheetParserHandler");
const { getOrGenerateStudyGuide, generateModuleDeepNotes } = require("./notesService");

/**
 * Universal Sub-Agent Dispatcher
 */
async function dispatch({
  action = "chat",
  query = "",
  context = {},
  history = [],
  customApiKey = null,
}) {
  const scope = context.scope || (context.problemContext ? "dsa_practice" : context.youtubeContext ? "youtube" : "dsa_practice");

  switch (action) {
    case "chat": {
      if (scope === "youtube") {
        const activeMode = context.mode || context.youtubeContext?.mode || context.videoContext?.mode || null;
        const result = await handleYouTubeChat({
          message: query,
          history,
          youtubeContext: context.youtubeContext || context.videoContext || context,
          mode: activeMode,
          customApiKey,
        });

        if (result && typeof result === "object" && result.type === "PARTIAL_READY") {
          return { ...result, timestamp: new Date().toISOString() };
        }

        return {
          reply: typeof result === "string" ? result : result?.reply,
          timestamp: new Date().toISOString(),
        };
      }

      if (scope === "rk_notes" || context.requiresRkNotes) {
        const reply = await handleRkNotesChat({
          message: query,
          history,
          rkContext: context.rkContext || context,
          customApiKey,
        });
        return { reply, timestamp: new Date().toISOString() };
      }

      // Default: DSA practice mentor chat
      const reply = await handleDsaChat({
        message: query,
        history,
        problemContext: context.problemContext || context.problem,
        customApiKey,
      });
      return { reply, timestamp: new Date().toISOString() };
    }

    case "suggest": {
      if (scope === "youtube") {
        const suggestions = await handleYouTubeSuggestions({
          youtubeContext: context.youtubeContext || context.videoContext,
          history,
          customApiKey,
        });
        return { suggestions };
      }

      if (scope === "rk_notes" || context.requiresRkNotes) {
        const suggestions = await handleRkNotesSuggestions({
          rkContext: context.rkContext || context,
          history,
          customApiKey,
        });
        return { suggestions };
      }

      const suggestions = await handleDsaSuggestions({
        problemContext: context.problemContext || context.problem,
        history,
        customApiKey,
      });
      return { suggestions };
    }

    case "generate_code": {
      const { type = "standalone", title, approachName, lang, baseCode, officialCode } = context;
      if (type === "official_harness") {
        const code = await generateOfficialHarnessSolution({ title, lang, officialCode, customApiKey });
        return { code };
      }
      const code = await generateStandaloneSolution({ title, approachName, lang, baseCode, customApiKey });
      return { code };
    }

    case "scan_sheet": {
      const { fileBase64, mimeType, fileName, rawText } = context;
      const problems = await scanSheetWithGemini({ fileBase64, mimeType, fileName, rawText, apiKey: customApiKey });
      return { problems };
    }

    default:
      throw new Error(`Unsupported agent action: ${action}`);
  }
}

module.exports = {
  dispatch,

  // Domain Handlers
  handleDsaChat,
  handleDsaSuggestions,
  handleYouTubeChat,
  handleYouTubeSuggestions,
  handleRkNotesChat,
  handleRkNotesSuggestions,

  // Code Gen & Sheet Scanning
  generateStandaloneSolution,
  generateOfficialHarnessSolution,
  scanSheetWithGemini,
  categorizeProblemsWithGemini,

  // Video Study Guides
  getOrGenerateStudyGuide,
  generateModuleDeepNotes,
};
