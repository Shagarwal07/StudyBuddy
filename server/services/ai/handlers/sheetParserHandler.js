/**
 * sheetParserHandler.js
 * Domain handler for OCR syllabus scanning & DSA curriculum categorization
 */

const {
  scanSheetWithGemini,
  categorizeProblemsWithGemini,
  SHEET_PARSER_PROMPT_VERSION,
} = require("../sheetParserService");

module.exports = {
  scanSheetWithGemini,
  categorizeProblemsWithGemini,
  SHEET_PARSER_PROMPT_VERSION,
};
