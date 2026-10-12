const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/notice.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { validateBody } = require("../middleware/validate");
const { createNoticeSchema } = require("../validators/notice.validator");

// GET /api/notices - Logged-in user
router.get("/", authenticateToken, noticeController.getNotices);

// GET /api/notices/:id - Logged-in user
router.get("/:id", authenticateToken, noticeController.getNoticeById);

// POST /api/notices - Teacher only
router.post(
  "/",
  authenticateToken,
  requireRole("teacher"),
  validateBody(createNoticeSchema),
  noticeController.createNotice
);

// PUT /api/notices/:id - Teacher only
router.put(
  "/:id",
  authenticateToken,
  requireRole("teacher"),
  noticeController.updateNotice
);

// DELETE /api/notices/:id - Teacher only
router.delete(
  "/:id",
  authenticateToken,
  requireRole("teacher"),
  noticeController.deleteNotice
);

// PATCH /api/notices/:id/publish - Teacher only
router.patch(
  "/:id/publish",
  authenticateToken,
  requireRole("teacher"),
  noticeController.publishNotice
);

module.exports = router;

