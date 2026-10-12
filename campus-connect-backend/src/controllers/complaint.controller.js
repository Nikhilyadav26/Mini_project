const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const { success, failure } = require("../utils/apiResponse");

const createComplaint = async (req, res, next) => {
  try {
    const { title, description, category } = req.body;

    const validCategories = ["academic", "facilities", "administration", "other"];
    if (!validCategories.includes(category)) {
      return failure(res, 400, "Category must be academic, facilities, administration, or other");
    }

    const complaint = await Complaint.create({
      studentId: req.user._id,
      title,
      description,
      category,
      status: "submitted",
      teacherResponse: ""
    });

    const populated = await Complaint.findById(complaint._id).populate("studentId", "name email");

    return success(res, 201, "Complaint submitted successfully", populated || complaint);
  } catch (error) {
    next(error);
  }
};

const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("studentId", "name email");

    return success(res, 200, "Own complaints retrieved successfully", complaints);
  } catch (error) {
    next(error);
  }
};

const getAllComplaints = async (req, res, next) => {
  try {
    // If teacher, return all complaints. If student, return their own complaints.
    const query = req.user && req.user.role === "teacher" ? {} : { studentId: req.user._id };

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .populate("studentId", "name email");

    return success(res, 200, "Complaints retrieved successfully", complaints);
  } catch (error) {
    next(error);
  }
};

const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid complaint ID format");
    }

    const complaint = await Complaint.findById(id).populate("studentId", "name email");
    if (!complaint) {
      return failure(res, 404, "Complaint not found");
    }

    return success(res, 200, "Complaint retrieved successfully", complaint);
  } catch (error) {
    next(error);
  }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, teacherResponse } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid complaint ID format");
    }

    const validStatuses = ["submitted", "in_progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return failure(res, 400, "Status must be submitted, in_progress, or resolved");
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return failure(res, 404, "Complaint not found");
    }

    complaint.status = status;
    if (typeof teacherResponse === "string") {
      complaint.teacherResponse = teacherResponse;
    }

    await complaint.save();

    const populated = await Complaint.findById(complaint._id).populate("studentId", "name email");

    return success(res, 200, "Complaint updated successfully", populated || complaint);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus
};
