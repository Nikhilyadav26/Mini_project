const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcement.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { validateBody } = require("../middleware/validate");
const { createAnnouncementSchema } = require("../validators/announcement.validator");

// GET /api/announcements - Logged-in user
router.get("/", authenticateToken, announcementController.getAnnouncements);

// POST /api/announcements - Teacher only
router.post(
  "/",
  authenticateToken,
  requireRole("teacher"),
  validateBody(createAnnouncementSchema),
  announcementController.createAnnouncement
);

// DELETE /api/announcements/:id - Teacher only
router.delete(
  "/:id",
  authenticateToken,
  requireRole("teacher"),
  announcementController.deleteAnnouncement
);

module.exports = router;
