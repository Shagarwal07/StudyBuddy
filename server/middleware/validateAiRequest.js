/**
 * Pre-flight request validation middleware for AI code generation endpoints.
 * Rejects invalid requests BEFORE burning Gemini API tokens.
 */
function validateAiRequest(req, res, next) {
  const { problemKey, slug, approachName, lang, isOfficialFull } = req.body;

  if (!problemKey && !slug) {
    return res.status(400).json({
      success: false,
      message: "problemKey or slug is required for AI solution generation.",
    });
  }

  const cleanLang = String(lang || "").toLowerCase().trim();
  const isOfficial = Boolean(
    isOfficialFull ||
    approachName?.includes("★") ||
    approachName?.toLowerCase().includes("official")
  );

  const allowedLangs = isOfficial ? ["cpp", "python", "java"] : ["cpp", "python"];

  if (!allowedLangs.includes(cleanLang)) {
    return res.status(400).json({
      success: false,
      message: `Invalid language '${cleanLang}'. Allowed: ${allowedLangs.join(", ")}. Note: JavaScript is not supported for AI generation.`,
    });
  }

  // Attach sanitized fields to req
  req.sanitizedAi = {
    cleanLang,
    isOfficial,
    targetApproach: isOfficial ? "★ Official - Full" : (approachName || "Optimal"),
  };

  next();
}

module.exports = validateAiRequest;
