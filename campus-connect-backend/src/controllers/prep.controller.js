const mongoose = require("mongoose");
const Opportunity = require("../models/Opportunity");
const aiService = require("../services/ai.service");
const { success, failure } = require("../utils/apiResponse");

const resolveOpportunityDetails = async (body) => {
  let { opportunityId, company, role, description, eligibility } = body;

  if (opportunityId) {
    if (!mongoose.Types.ObjectId.isValid(opportunityId)) {
      const err = new Error("Invalid opportunity ID format");
      err.statusCode = 400;
      throw err;
    }
    const opp = await Opportunity.findById(opportunityId);
    if (!opp) {
      const err = new Error("Referenced placement opportunity not found");
      err.statusCode = 404;
      throw err;
    }
    company = opp.company;
    role = opp.role;
    description = opp.description;
    eligibility = opp.eligibility;
  }

  return { company, role, description, eligibility };
};

const getPlacementQuiz = async (req, res, next) => {
  try {
    const oppDetails = await resolveOpportunityDetails(req.body);
    const { numberOfQuestions } = req.body;

    const quiz = await aiService.generatePlacementQuiz({
      company: oppDetails.company,
      role: oppDetails.role,
      description: oppDetails.description,
      eligibility: oppDetails.eligibility,
      numberOfQuestions: numberOfQuestions || 5
    });

    return success(res, 200, "Placement preparation quiz generated successfully", quiz);
  } catch (error) {
    if (error.statusCode) return failure(res, error.statusCode, error.message);
    next(error);
  }
};

const getMockInterviewQuestions = async (req, res, next) => {
  try {
    const oppDetails = await resolveOpportunityDetails(req.body);
    const { level } = req.body;

    const interviewSet = await aiService.generateMockInterview({
      company: oppDetails.company,
      role: oppDetails.role,
      description: oppDetails.description,
      level: level || "entry"
    });

    return success(res, 200, "Mock interview questions generated successfully", interviewSet);
  } catch (error) {
    if (error.statusCode) return failure(res, error.statusCode, error.message);
    next(error);
  }
};

const getSkillGapReport = async (req, res, next) => {
  try {
    const oppDetails = await resolveOpportunityDetails(req.body);
    const { studentSkills, studentExperience } = req.body;

    const report = await aiService.generateSkillGapReport({
      company: oppDetails.company,
      role: oppDetails.role,
      description: oppDetails.description,
      studentSkills: studentSkills || [],
      studentExperience: studentExperience || ""
    });

    return success(res, 200, "Skill-gap analysis report generated successfully", report);
  } catch (error) {
    if (error.statusCode) return failure(res, error.statusCode, error.message);
    next(error);
  }
};

module.exports = {
  getPlacementQuiz,
  getMockInterviewQuestions,
  getSkillGapReport
};
