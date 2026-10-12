const { failure } = require("../utils/apiResponse");

const notFound = (req, res, next) => {
  return failure(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

module.exports = notFound;
