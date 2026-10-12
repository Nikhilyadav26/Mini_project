const { failure } = require("../utils/apiResponse");

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return failure(res, 401, "Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      return failure(res, 403, "Forbidden: Insufficient permissions");
    }

    next();
  };
};

module.exports = requireRole;
