const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/application.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { validateBody } = require("../middleware/validate");
const {
  createApplicationSchema,
  updateApplicationStatusSchema
} = require("../validators/application.validator");

// POST /api/applications - Student only
router.post(
  "/",
  authenticateToken,
  requireRole("student"),
  validateBody(createApplicationSchema),
  applicationController.createApplication
);

// GET /api/applications/mine - Student only
router.get(
  "/mine",
  authenticateToken,
  requireRole("student"),
  applicationController.getMyApplications
);

// PATCH /api/applications/:id/status - Teacher only
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole("teacher"),
  validateBody(updateApplicationStatusSchema),
  applicationController.updateApplicationStatus
);

module.exports = router;
