const Opportunity = require("../models/Opportunity");
const { success, failure } = require("../utils/apiResponse");

const getOpportunities = async (req, res, next) => {
  try {
    const opportunities = await Opportunity.find()
      .sort({ deadline: 1 })
      .populate("createdBy", "name email role");

    return success(res, 200, "Opportunities retrieved successfully", opportunities);
  } catch (error) {
    next(error);
  }
};

const createOpportunity = async (req, res, next) => {
  try {
    const {
      company,
      role,
      description,
      eligibility,
      packageOrStipend,
      deadline,
      applicationLink
    } = req.body;

    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return failure(res, 400, "Invalid deadline date format");
    }

    const opportunity = await Opportunity.create({
      company,
      role,
      description,
      eligibility,
      packageOrStipend,
      deadline: parsedDeadline,
      applicationLink,
      createdBy: req.user._id
    });

    return success(res, 201, "Opportunity created successfully", opportunity);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOpportunities,
  createOpportunity
};
