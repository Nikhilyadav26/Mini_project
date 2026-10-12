const express = require("express");
const router = express.Router();
const roadmapController = require("../controllers/roadmap.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { validateBody } = require("../middleware/validate");
const {
  generateRoadmapSchema,
  createRoadmapSchema,
  updateSessionStatusSchema,
  rescheduleRoadmapSchema
} = require("../validators/roadmap.validator");

// Teacher generates class-by-class teaching schedule via AI
router.post(
  "/generate",
  authenticateToken,
  requireRole("teacher"),
  validateBody(generateRoadmapSchema),
  roadmapController.generateRoadmap
);

// Teacher saves a teaching roadmap
router.post(
  "/",
  authenticateToken,
  requireRole("teacher"),
  validateBody(createRoadmapSchema),
  roadmapController.createRoadmap
);

// Logged-in students and teachers can view roadmaps
router.get("/", authenticateToken, roadmapController.getRoadmaps);

// View roadmap details and planned topics
router.get("/:id", authenticateToken, roadmapController.getRoadmapById);

// Teacher marks topic complete, missed, etc.
router.patch(
  "/:id/sessions/:classNumber",
  authenticateToken,
  requireRole("teacher"),
  validateBody(updateSessionStatusSchema),
  roadmapController.updateSessionStatus
);

// Teacher adaptively reschedules remaining topics when classes are missed
router.post(
  "/:id/reschedule",
  authenticateToken,
  requireRole("teacher"),
  validateBody(rescheduleRoadmapSchema),
  roadmapController.rescheduleRoadmap
);

module.exports = router;
