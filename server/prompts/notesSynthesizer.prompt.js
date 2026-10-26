/**
 * notesSynthesizer.prompt.js
 * Grounded, hallucination-free prompts for YouTube study guides & chapters
 */

const NOTES_PROMPT_VERSION = 3;

/**
 * Phase 1 Prompt: YouTube Chapterizer
 * Strict, factual, grounded in transcript. No buzzwords.
 */
function buildRoadmapPrompt({ title, durationInSeconds = 0, description = "", transcriptSamples = "" }) {
  const durationMin = Math.floor(durationInSeconds / 60);

  return `You are a YouTube chapterizer. Create 5-12 chapters. Each chapter 5-25 mins minimum.
Title <6 words. Overview 1 line <20 words grounded strictly in the transcript.
If video is only installation/setup, do not invent variables/operators or extra topics.

Video Title: "${title}"
Total Duration: ${durationMin} minutes
Description: ${description ? description.slice(0, 1000) : "N/A"}

Transcript Samples with Timestamps:
${transcriptSamples}

Return ONLY valid JSON matching this schema:
{
  "executiveOverview": "2 lines max summary of what is actually taught in this video",
  "roadmap": [
    {
      "index": 0,
      "title": "Title < 6 words",
      "startSeconds": 0,
      "endSeconds": 600,
      "timeFormatted": "00:00 - 10:00",
      "overview": "1 line < 20 words grounded in transcript."
    }
  ]
}`;
}

/**
 * Phase 2 Prompt: Chapter Study Notes
 * Detailed, factual, formatted into clean sections with banned buzzwords.
 */
function buildModuleDeepPrompt({
  courseTitle,
  moduleTitle,
  moduleIndex,
  totalModules,
  startSeconds = 0,
  endSeconds = 0,
  timeFormatted = "",
  moduleTranscript = "",
}) {
  return `You are writing study notes for ONE chapter.
Course: "${courseTitle}"
Chapter ${moduleIndex + 1}/${totalModules}: "${moduleTitle}"
Time: ${timeFormatted || `${Math.floor(startSeconds / 60)}m - ${Math.floor(endSeconds / 60)}m`}

Transcript Slice:
${moduleTranscript}

Rules:
1. Commands verbatim from video:
   - Windows: python --version, Mac: python3 --version.
   - Installer checkbox: "Add python to PATH".
2. If Python execution is explained, explicitly detail: source code (.py) -> Python compiler -> Bytecode (.pyc) -> Python Virtual Machine (PVM) interpreter.
3. Structure your notes with these exact headings:
   ## Overview
   (Clear explanation of the chapter goals, rationale, and workflow)

   ## Concepts
   (Bullet points with definitions and clear mental models)

   ## Commands & Code
   (Syntactically valid, runnable code snippets or terminal commands verbatim from the lecture)

   ## Gotchas & Common Mistakes
   (Concrete traps beginners fall into, e.g. path errors, case sensitivity, type errors)

   ### Key Insights
   - Bullet 1
   - Bullet 2
   - Bullet 3

4. Grounding: Only include concepts and commands directly taught or referenced in the transcript.
5. Do NOT use fluff words: "reigns supreme", "elite", "architecting", "comprehensive curriculum", "leveraging robust".
6. Return clean Markdown only (do NOT wrap in JSON).`;
}

/**
 * Single-pass prompt for short videos (< 30 mins)
 */
function buildSinglePassDeepPrompt({ title, durationInSeconds = 0, description = "", transcriptText = "" }) {
  return `You are writing concise study notes for a short educational video.
Title: "${title}"
Duration: ${Math.floor(durationInSeconds / 60)} minutes
${description ? `Description: ${description.slice(0, 500)}` : ""}

Transcript:
${transcriptText}

Rules:
1. Commands and syntax must be verbatim from the video.
2. Structure notes with: ## Overview, ## Concepts, ## Commands/Code, ## Gotchas.
3. Banned words: "reigns supreme", "elite", "architecting", "comprehensive curriculum", "leveraging robust".
4. If not mentioned in the transcript, do not invent it.

Return ONLY valid JSON matching this schema:
{
  "executiveOverview": "2-3 lines summarizing the core takeaway of this video",
  "roadmap": [
    {
      "index": 0,
      "title": "Title < 6 words",
      "startSeconds": 0,
      "endSeconds": ${durationInSeconds || 600},
      "timeFormatted": "00:00 - ${Math.floor(durationInSeconds / 60)}:00",
      "overview": "1 line overview"
    }
  ],
  "fullMarkdownGuide": "## Overview\\n...\\n\\n## Concepts\\n...\\n\\n## Commands/Code\\n...\\n\\n## Gotchas\\n...",
  "keyInsights": ["Point 1", "Point 2", "Point 3"]
}`;
}

module.exports = {
  NOTES_PROMPT_VERSION,
  buildRoadmapPrompt,
  buildModuleDeepPrompt,
  buildSinglePassDeepPrompt,
};
