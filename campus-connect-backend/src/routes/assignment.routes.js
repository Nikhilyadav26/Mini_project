const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignment.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { validateBody } = require("../middleware/validate");
const {
  createAssignmentSchema,
  aiFeedbackSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema
} = require("../validators/assignment.validator");

// Teacher creates assignment with rubric
router.post(
  "/",
  authenticateToken,
  requireRole("teacher"),
  validateBody(createAssignmentSchema),
  assignmentController.createAssignment
);

// Logged-in users list assignments
router.get("/", authenticateToken, assignmentController.getAssignments);

// Logged-in users get assignment details
router.get("/:id", authenticateToken, assignmentController.getAssignmentById);

// Student receives AI feedback against rubric before official submission
router.post(
  "/:id/ai-feedback",
  authenticateToken,
  requireRole("student"),
  validateBody(aiFeedbackSchema),
  assignmentController.requestAiFeedback
);

// Student officially submits assignment
router.post(
  "/:id/submit",
  authenticateToken,
  requireRole("student"),
  validateBody(submitAssignmentSchema),
  assignmentController.submitAssignment
);

// Student views their own submission and past AI feedback loop
router.get(
  "/:id/my-submission",
  authenticateToken,
  requireRole("student"),
  assignmentController.getMySubmission
);

// Teacher views all submissions for an assignment
router.get(
  "/:id/submissions",
  authenticateToken,
  requireRole("teacher"),
  assignmentController.getAllSubmissions
);

// Teacher officially grades and provides feedback
router.patch(
  "/:id/submissions/:submissionId/grade",
  authenticateToken,
  requireRole("teacher"),
  validateBody(gradeSubmissionSchema),
  assignmentController.gradeSubmission
);

module.exports = router;
