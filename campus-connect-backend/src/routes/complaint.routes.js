const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaint.controller");
const authenticateToken = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { validateBody } = require("../middleware/validate");
const {
  createComplaintSchema,
  updateComplaintStatusSchema
} = require("../validators/complaint.validator");

// POST /api/complaints - Any logged-in student (or user)
router.post(
  "/",
  authenticateToken,
  validateBody(createComplaintSchema),
  complaintController.createComplaint
);

// GET /api/complaints/mine - Student's own complaints
router.get(
  "/mine",
  authenticateToken,
  complaintController.getMyComplaints
);

// GET /api/complaints - Returns all complaints for teachers, or own complaints for students
router.get(
  "/",
  authenticateToken,
  complaintController.getAllComplaints
);

// GET /api/complaints/:id - View specific complaint
router.get(
  "/:id",
  authenticateToken,
  complaintController.getComplaintById
);

// PATCH /api/complaints/:id/status - Teacher only (or student resolution acknowledgement)
router.patch(
  "/:id/status",
  authenticateToken,
  requireRole("teacher"),
  validateBody(updateComplaintStatusSchema),
  complaintController.updateComplaintStatus
);

module.exports = router;
