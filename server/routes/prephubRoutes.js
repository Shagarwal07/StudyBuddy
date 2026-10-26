const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const prephubController = require("../controllers/prephubController");

router.use(authMiddleware);

router.get("/subjects", prephubController.getOverview);
router.get("/subject/:subjectId", prephubController.getSubjectDetails);
router.post("/import-sheet", prephubController.importSheet);

// RK Coaching Student Verification Routes
router.post("/verify-passkey", prephubController.verifyPasskey);
router.post("/request-verification", prephubController.requestVerification);

module.exports = router;
