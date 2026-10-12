const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

// POST /api/ai/rewrite-notice - Teacher only
router.post(
  "/rewrite-notice",
  authenticateToken,
  requireRole("teacher"),
  aiController.rewriteNotice
);

module.exports = router;
