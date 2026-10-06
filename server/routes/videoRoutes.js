const express = require("express");
const router = express.Router();
const verifyVideoOwnership = require("../middleware/videoOwnershipMiddleware");

const protect = require("../middleware/authMiddleware");
const {
  updateVideoStatus,
  updateVideoNotes,
  updateVideoProgress,
} = require("../controllers/videoController");

router.use(protect);

router.patch("/:id", verifyVideoOwnership, updateVideoStatus);
router.patch("/:id/notes", verifyVideoOwnership, updateVideoNotes);
router.patch("/:id/progress", verifyVideoOwnership, updateVideoProgress);

module.exports = router;
