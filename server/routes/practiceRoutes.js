const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const practiceController = require("../controllers/practiceController");
const { practiceSolutionLimiter } = require("../middleware/rateLimiters");

router.use(authMiddleware);

router.get("/sheets", practiceController.getSheets);
router.post("/enroll", practiceController.enrollSheet);
router.post("/unenroll", practiceController.unenrollSheet);
router.get("/sheet/:sheetId", practiceController.getSheetDetails);
router.get("/solution/:problemKey", practiceSolutionLimiter, practiceController.getProblemSolution);
router.post("/toggle-status", practiceController.toggleProblemStatus);
router.post("/toggle-starred", practiceController.toggleProblemStarred);
router.post("/custom-sheet", practiceController.createCustomSheet);
router.post("/custom-sheet/sync", practiceController.syncCustomSheet);
router.delete("/custom-sheet/:sheetId", practiceController.deleteCustomSheet);
router.post("/sync-submission", practiceController.syncSubmission);
router.post("/sync-batch", practiceController.syncBatchSubmissions);
router.get("/user-status", practiceController.getUserStatus);
router.post("/reset-progress", practiceController.resetProgress);

module.exports = router;
