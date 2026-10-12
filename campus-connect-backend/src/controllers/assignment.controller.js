const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const aiService = require("../services/ai.service");
const { success, failure } = require("../utils/apiResponse");

const createAssignment = async (req, res, next) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const rubric = req.body.rubric || (Array.isArray(req.body.rubricCriteria) ? req.body.rubricCriteria.join("\n") : req.body.rubricCriteria) || "Standard assignment criteria";
    const deadlineVal = req.body.deadline || req.body.dueDate;
    const maxScore = Number(req.body.maxScore || req.body.maxMarks || 100);

    const assignment = await Assignment.create({
      title,
      description,
      rubric,
      deadline: new Date(deadlineVal),
      maxScore,
      createdBy: req.user._id
    });

    const populated = await Assignment.findById(assignment._id).populate("createdBy", "name email");

    return success(res, 201, "Assignment created successfully", populated || assignment);
  } catch (error) {
    next(error);
  }
};

const getAssignments = async (req, res, next) => {
  try {
    const assignments = await Assignment.find()
      .sort({ deadline: 1 })
      .populate("createdBy", "name email");

    return success(res, 200, "Assignments retrieved successfully", assignments);
  } catch (error) {
    next(error);
  }
};

const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid assignment ID format");
    }

    const assignment = await Assignment.findById(id).populate("createdBy", "name email");
    if (!assignment) {
      return failure(res, 404, "Assignment not found");
    }

    return success(res, 200, "Assignment retrieved successfully", assignment);
  } catch (error) {
    next(error);
  }
};

const requestAiFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const draftContent = req.body.draftContent || req.body.submissionText;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid assignment ID format");
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return failure(res, 404, "Assignment not found");
    }

    const evaluation = await aiService.evaluateAssignmentDraft({
      assignmentTitle: assignment.title,
      assignmentDescription: assignment.description,
      rubric: assignment.rubric,
      draftContent
    });

    // Upsert student's submission record to preserve AI improvement history
    let submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: req.user._id
    });

    if (!submission) {
      submission = new Submission({
        assignmentId: assignment._id,
        studentId: req.user._id,
        content: draftContent,
        status: "draft"
      });
    }

    submission.content = draftContent;
    if (!submission.aiFeedbackHistory) submission.aiFeedbackHistory = [];
    submission.aiFeedbackHistory.push({
      draftContent,
      readinessScore: String(evaluation.readinessScore || "80"),
      strengths: evaluation.strengths || [],
      missingPoints: evaluation.missingPoints || [],
      improvementSuggestions: evaluation.suggestions || evaluation.improvementSuggestions || [],
      evaluatedAt: new Date()
    });

    await submission.save();

    return success(res, 200, "AI assignment feedback generated successfully", {
      assignmentId: assignment._id,
      evaluation,
      totalFeedbackIterations: submission.aiFeedbackHistory.length
    });
  } catch (error) {
    if (error.statusCode) return failure(res, error.statusCode, error.message);
    next(error);
  }
};

const submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const content = req.body.content || req.body.submissionText;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid assignment ID format");
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return failure(res, 404, "Assignment not found");
    }

    let submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: req.user._id
    });

    if (!submission) {
      submission = new Submission({
        assignmentId: assignment._id,
        studentId: req.user._id,
        content,
        status: "submitted",
        submittedAt: new Date()
      });
    } else {
      submission.content = content;
      submission.status = "submitted";
      submission.submittedAt = new Date();
    }

    await submission.save();

    return success(res, 200, "Assignment submitted successfully", submission);
  } catch (error) {
    next(error);
  }
};

const getMySubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid assignment ID format");
    }

    const submission = await Submission.findOne({
      assignmentId: id,
      studentId: req.user._id
    }).populate("assignmentId", "title description rubric deadline maxScore");

    if (!submission) {
      return success(res, 200, "No submission yet for this assignment", null);
    }

    return success(res, 200, "Student submission retrieved successfully", submission);
  } catch (error) {
    next(error);
  }
};

const getAllSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid assignment ID format");
    }

    const submissions = await Submission.find({ assignmentId: id })
      .sort({ submittedAt: -1 })
      .populate("studentId", "name email");

    return success(res, 200, "Assignment submissions retrieved successfully", submissions);
  } catch (error) {
    next(error);
  }
};

const gradeSubmission = async (req, res, next) => {
  try {
    const { id, submissionId } = req.params;
    const teacherGrade = req.body.teacherGrade !== undefined ? req.body.teacherGrade : req.body.marks;
    const teacherFeedback = req.body.teacherFeedback !== undefined ? req.body.teacherFeedback : req.body.feedback;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return failure(res, 400, "Invalid submission ID format");
    }

    const submission = await Submission.findById(submissionId).populate("studentId", "name email");
    if (!submission) {
      return failure(res, 404, "Submission not found");
    }

    submission.teacherGrade = Number(teacherGrade);
    if (teacherFeedback !== undefined) submission.teacherFeedback = teacherFeedback;
    submission.gradedAt = new Date();
    await submission.save();

    return success(res, 200, "Assignment graded successfully", submission);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  requestAiFeedback,
  submitAssignment,
  getMySubmission,
  getAllSubmissions,
  gradeSubmission
};
