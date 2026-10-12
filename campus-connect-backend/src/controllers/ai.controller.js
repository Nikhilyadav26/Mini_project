const aiService = require("../services/ai.service");
const { success, failure } = require("../utils/apiResponse");

const rewriteNotice = async (req, res, next) => {
  try {
    const { rawText } = req.body;

    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      return failure(res, 400, "rawText is required and cannot be empty");
    }

    if (rawText.trim().length > 5000) {
      return failure(res, 400, "rawText exceeds the maximum allowed length of 5000 characters");
    }

    const draft = await aiService.rewriteNoticeDraft(rawText.trim());

    return success(res, 200, "Notice draft generated", {
      title: draft.title,
      content: draft.content
    });
  } catch (error) {
    if (error.statusCode) {
      return failure(res, error.statusCode, error.message);
    }
    next(error);
  }
};

module.exports = {
  rewriteNotice
};
