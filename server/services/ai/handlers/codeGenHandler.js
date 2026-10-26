/**
 * codeGenHandler.js
 * Domain handler for Standalone Competitive Programming code & Official LeetCode harnesses
 */

const {
  generateStandaloneSolution,
  generateOfficialHarnessSolution,
  CODEGEN_PROMPT_VERSION,
} = require("../codeGenService");

module.exports = {
  generateStandaloneSolution,
  generateOfficialHarnessSolution,
  CODEGEN_PROMPT_VERSION,
};
