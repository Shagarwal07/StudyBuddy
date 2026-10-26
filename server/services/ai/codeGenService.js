const { generateContent } = require("../../config/geminiClient");
const {
  CODEGEN_PROMPT_VERSION,
  buildStandalonePrompt,
  buildOfficialHarnessPrompt,
  extractCodeFromReply,
} = require("../../prompts/codeGen.prompt");

/**
 * Standalone Competitive Programming Code Generator (3-Tier Tabs)
 */
async function generateStandaloneSolution({
  title,
  approachName = "Optimal",
  lang, // "cpp" | "python"
  baseCode = "",
  timeComplexity = "",
  spaceComplexity = "",
  explanation = "",
  customApiKey = null,
}) {
  const cleanLang = String(lang || "").toLowerCase().trim();
  const prompt = buildStandalonePrompt({
    title,
    approachName,
    lang: cleanLang,
    baseCode,
    timeComplexity,
    spaceComplexity,
    explanation,
  });

  const result = await generateContent({
    contents: [{ parts: [{ text: prompt }] }],
    temperature: 0.2,
    maxOutputTokens: 2500,
    customApiKey,
  });

  return extractCodeFromReply(result.text, cleanLang);
}

/**
 * Official LeetCode Runner Harness Generator ("View Full Code")
 */
async function generateOfficialHarnessSolution({
  title,
  lang, // "cpp" | "java" | "python"
  officialCode = "",
  customApiKey = null,
}) {
  const cleanLang = String(lang || "").toLowerCase().trim();
  const prompt = buildOfficialHarnessPrompt({
    title,
    lang: cleanLang,
    officialCode,
  });

  const result = await generateContent({
    contents: [{ parts: [{ text: prompt }] }],
    temperature: 0.2,
    maxOutputTokens: 2500,
    customApiKey,
  });

  return extractCodeFromReply(result.text, cleanLang);
}

module.exports = {
  generateStandaloneSolution,
  generateOfficialHarnessSolution,
  CODEGEN_PROMPT_VERSION,
};
