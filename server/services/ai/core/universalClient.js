/**
 * universalClient.js
 * Upstream client adapter connecting Billu AI Sub-Agent to the Universal Main Agent (LearnStudio / Central RAG)
 * Features non-blocking timeout, circuit resilience, and seamless offline fallback.
 */

const axios = require("axios");

const UNIVERSAL_AGENT_URL = process.env.UNIVERSAL_AGENT_URL || null;
const UNIVERSAL_AGENT_API_KEY = process.env.UNIVERSAL_AGENT_API_KEY || null;
const REQUEST_TIMEOUT_MS = parseInt(process.env.UNIVERSAL_AGENT_TIMEOUT_MS || "3500", 10);

/**
 * Queries the Universal Main Agent for centralized teacher notes and syllabus RAG chunks
 */
async function queryUniversalMainAgent({
  query,
  tenant = "studybuddy",
  targetSource = "rk_workspace_notes",
  metadata = {},
}) {
  // If Main Agent is not configured, gracefully return offline status
  if (!UNIVERSAL_AGENT_URL) {
    return {
      available: false,
      source: "local_offline_fallback",
      contextText: "",
      chunks: [],
      reason: "Universal Main Agent service is not configured (operates in autonomous local mode).",
    };
  }

  try {
    const response = await axios.post(
      `${UNIVERSAL_AGENT_URL}/api/v1/rag/query`,
      {
        query,
        tenant,
        targetSource,
        metadata,
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(UNIVERSAL_AGENT_API_KEY ? { Authorization: `Bearer ${UNIVERSAL_AGENT_API_KEY}` } : {}),
          "X-Tenant-Id": tenant,
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const data = response.data;
    return {
      available: true,
      source: "universal_main_agent",
      contextText: data?.synthesizedContext || data?.context || "",
      chunks: Array.isArray(data?.chunks) ? data.chunks : [],
    };
  } catch (error) {
    console.warn(
      `[UniversalClient] Upstream Main Agent unreachable (${error.code || error.message}). Falling back to local knowledge.`
    );
    return {
      available: false,
      source: "local_offline_fallback",
      contextText: "",
      chunks: [],
      reason: error.message,
    };
  }
}

module.exports = {
  UNIVERSAL_AGENT_URL,
  queryUniversalMainAgent,
};
