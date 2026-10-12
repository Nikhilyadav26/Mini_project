const mongoose = require("mongoose");
const Application = require("../models/Application");
const Opportunity = require("../models/Opportunity");
const { success, failure } = require("../utils/apiResponse");

const createApplication = async (req, res, next) => {
  try {
    const { opportunityId, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      return failure(res, 400, "Invalid opportunityId format");
    }

    const applicationStatus = status || "saved";
    if (!["saved", "applied"].includes(applicationStatus)) {
      return failure(res, 400, "Students can only submit status as 'saved' or 'applied'");
    }

    const opportunity = await Opportunity.findById(opportunityId);
    if (!opportunity) {
      return failure(res, 404, "Referenced opportunity not found");
    }

    const existingApplication = await Application.findOne({
      studentId: req.user._id,
      opportunityId
    });

    if (existingApplication) {
      return failure(res, 409, "An application for this opportunity already exists");
    }

    const application = await Application.create({
      studentId: req.user._id,
      opportunityId,
      status: applicationStatus
    });

    const populated = await Application.findById(application._id).populate(
      "opportunityId",
      "company role description eligibility packageOrStipend deadline applicationLink"
    );

    return success(res, 201, "Application recorded successfully", populated || application);
  } catch (error) {
    if (error.code === 11000) {
      return failure(res, 409, "An application for this opportunity already exists");
    }
    next(error);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("opportunityId", "company role description eligibility packageOrStipend deadline applicationLink");

    return success(res, 200, "Own applications retrieved successfully", applications);
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid application ID format");
    }

    const validTeacherStatuses = ["shortlisted", "rejected", "selected"];
    if (!validTeacherStatuses.includes(status)) {
      return failure(res, 400, "Teacher can only update status to shortlisted, rejected, or selected");
    }

    const application = await Application.findById(id);
    if (!application) {
      return failure(res, 404, "Application not found");
    }

    application.status = status;
    await application.save();

    const populated = await Application.findById(application._id)
      .populate("opportunityId", "company role packageOrStipend deadline")
      .populate("studentId", "name email");

    return success(res, 200, "Application status updated successfully", populated || application);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  updateApplicationStatus
};
