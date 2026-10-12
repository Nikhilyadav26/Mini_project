const express = require("express");
const router = express.Router();
const eventController = require("../controllers/event.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { validateBody } = require("../middleware/validate");
const { createEventSchema } = require("../validators/event.validator");

// GET /api/events - Logged-in user
router.get("/", authenticateToken, eventController.getEvents);

// POST /api/events - Teacher only
router.post(
  "/",
  authenticateToken,
  requireRole("teacher"),
  validateBody(createEventSchema),
  eventController.createEvent
);

// PUT /api/events/:id - Teacher only
router.put(
  "/:id",
  authenticateToken,
  requireRole("teacher"),
  eventController.updateEvent
);

// DELETE /api/events/:id - Teacher only
router.delete(
  "/:id",
  authenticateToken,
  requireRole("teacher"),
  eventController.deleteEvent
);

// POST /api/events/:id/register - Student only
router.post(
  "/:id/register",
  authenticateToken,
  requireRole("student"),
  eventController.registerForEvent
);

module.exports = router;

