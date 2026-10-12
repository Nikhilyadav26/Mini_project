const mongoose = require("mongoose");
const Roadmap = require("../models/Roadmap");
const aiService = require("../services/ai.service");
const { success, failure } = require("../utils/apiResponse");

const generateRoadmap = async (req, res, next) => {
  try {
    const { subject, semester, syllabusText, startDate, endDate, classesPerWeek, holidays } = req.body;

    const generated = await aiService.generateAdaptiveRoadmap({
      syllabusText,
      subject,
      semester,
      startDate,
      endDate,
      holidays: holidays || [],
      classesPerWeek: classesPerWeek || 3
    });

    return success(res, 200, "Teaching roadmap generated successfully", generated);
  } catch (error) {
    if (error.statusCode) return failure(res, error.statusCode, error.message);
    next(error);
  }
};

const createRoadmap = async (req, res, next) => {
  try {
    const { subject, semester, startDate, endDate, classesPerWeek, holidays, schedule } = req.body;

    const roadmap = await Roadmap.create({
      subject,
      semester,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      classesPerWeek,
      holidays: holidays || [],
      totalPlannedClasses: schedule.length,
      schedule,
      createdBy: req.user._id
    });

    return success(res, 201, "Roadmap saved successfully", roadmap);
  } catch (error) {
    next(error);
  }
};

const getRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    return success(res, 200, "Teaching roadmaps retrieved successfully", roadmaps);
  } catch (error) {
    next(error);
  }
};

const getRoadmapById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid roadmap ID format");
    }

    const roadmap = await Roadmap.findById(id).populate("createdBy", "name email");
    if (!roadmap) {
      return failure(res, 404, "Roadmap not found");
    }

    return success(res, 200, "Roadmap retrieved successfully", roadmap);
  } catch (error) {
    next(error);
  }
};

const updateSessionStatus = async (req, res, next) => {
  try {
    const { id, classNumber } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid roadmap ID format");
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return failure(res, 404, "Roadmap not found");
    }

    const targetClassNum = parseInt(classNumber, 10);
    const session = roadmap.schedule.find((s) => s.classNumber === targetClassNum);
    if (!session) {
      return failure(res, 404, `Session with class number ${classNumber} not found in roadmap`);
    }

    session.status = status;
    if (notes !== undefined) session.notes = notes;
    if (status === "completed") {
      session.completedAt = new Date();
    } else {
      session.completedAt = null;
    }

    await roadmap.save();
    return success(res, 200, "Session status updated successfully", session);
  } catch (error) {
    next(error);
  }
};

const rescheduleRoadmap = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { missedClassNumbers, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid roadmap ID format");
    }

    const roadmap = await Roadmap.findById(id);
    if (!roadmap) {
      return failure(res, 404, "Roadmap not found");
    }

    const rescheduledData = await aiService.rescheduleRoadmap({
      roadmap,
      missedClassNumbers,
      reason
    });

    if (Array.isArray(rescheduledData.updatedSchedule) && rescheduledData.updatedSchedule.length > 0) {
      roadmap.schedule = rescheduledData.updatedSchedule;
      await roadmap.save();
    }

    return success(res, 200, "Roadmap adaptively rescheduled successfully", {
      adjustmentSummary: rescheduledData.adjustmentSummary || "Schedule reorganized",
      updatedRoadmap: roadmap
    });
  } catch (error) {
    if (error.statusCode) return failure(res, error.statusCode, error.message);
    next(error);
  }
};

module.exports = {
  generateRoadmap,
  createRoadmap,
  getRoadmaps,
  getRoadmapById,
  updateSessionStatus,
  rescheduleRoadmap
};
