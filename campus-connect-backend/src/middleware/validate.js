const { failure } = require("../utils/apiResponse");

const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = firstIssue.path.join(".");
    const message = field ? `${field}: ${firstIssue.message}` : firstIssue.message || "Invalid input";
    return failure(res, 400, message);
  }
  req.body = result.data;
  next();
};

module.exports = {
  validateBody
};
