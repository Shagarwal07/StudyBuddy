const express = require("express");
const router = express.Router();

const {
  syncPlaylist,
  deletePlaylist,
  resyncPlaylist,
  getUserPlaylists,
  getPlaylistDetails,
} = require("../controllers/playlistController");

const protect = require("../middleware/authMiddleware");
const verifyPlaylistOwnership = require("../middleware/playlistOwnershipMiddleware");

router.post("/sync", protect, syncPlaylist);

router.get("/", protect, getUserPlaylists);

router.get("/:id", protect, verifyPlaylistOwnership, getPlaylistDetails);

router.delete("/:id", protect, verifyPlaylistOwnership, deletePlaylist);

router.post("/:id/resync", protect, verifyPlaylistOwnership, resyncPlaylist);

module.exports = router;
