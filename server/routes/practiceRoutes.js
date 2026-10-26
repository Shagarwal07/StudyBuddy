const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const validateAiRequest = require("../middleware/validateAiRequest");
const practiceController = require("../controllers/practiceController");
const { practiceSolutionLimiter } = require("../middleware/rateLimiters");

router.use(authMiddleware);

router.get("/sheets", practiceController.getSheets);
router.post("/enroll", practiceController.enrollSheet);
router.post("/unenroll", practiceController.unenrollSheet);
router.get("/sheet/:sheetId", practiceController.getSheetDetails);
router.get("/solution/:problemKey", practiceSolutionLimiter, practiceController.getProblemSolution);
router.post("/solution/save-ai", practiceController.saveAiSolution);
router.post("/solution/generate-ai", validateAiRequest, practiceController.generateAiSolution);
router.post("/toggle-status", practiceController.toggleProblemStatus);
router.post("/toggle-starred", practiceController.toggleProblemStarred);
router.post("/custom-sheet", practiceController.createCustomSheet);
router.post("/custom-sheet/sync", practiceController.syncCustomSheet);
router.delete("/custom-sheet/:sheetId", practiceController.deleteCustomSheet);
router.post("/reset-progress", practiceController.resetProgress);
router.get("/problem-note/:problemKey", practiceController.getProblemNote);
router.post("/problem-note/:problemKey", practiceController.saveProblemNote);

module.exports = router;
