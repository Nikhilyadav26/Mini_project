const express = require("express");
const router = express.Router();
const opportunityController = require("../controllers/opportunity.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { validateBody } = require("../middleware/validate");
const { createOpportunitySchema } = require("../validators/opportunity.validator");

// GET /api/opportunities - Logged-in user
router.get("/", authenticateToken, opportunityController.getOpportunities);

// POST /api/opportunities - Teacher only
router.post(
  "/",
  authenticateToken,
  requireRole("teacher"),
  validateBody(createOpportunitySchema),
  opportunityController.createOpportunity
);

module.exports = router;
