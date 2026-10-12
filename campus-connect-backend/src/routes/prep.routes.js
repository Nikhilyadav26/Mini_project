const express = require("express");
const router = express.Router();
const prepController = require("../controllers/prep.controller");
const authenticateToken = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const {
  prepQuizSchema,
  prepInterviewSchema,
  prepSkillGapSchema
} = require("../validators/prep.validator");

// Generate role-specific practice quiz from job description / opportunity
router.post(
  "/quiz",
  authenticateToken,
  validateBody(prepQuizSchema),
  prepController.getPlacementQuiz
);

// Generate mock interview questions and answer guidance
router.post(
  "/mock-interview",
  authenticateToken,
  validateBody(prepInterviewSchema),
  prepController.getMockInterviewQuestions
);

// Generate skill-gap report and preparation recommendations
router.post(
  "/skill-gap",
  authenticateToken,
  validateBody(prepSkillGapSchema),
  prepController.getSkillGapReport
);

module.exports = router;
