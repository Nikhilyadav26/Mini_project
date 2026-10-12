const { failure } = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  // Log unexpected errors internally for debugging (never leak to client)
  console.error(`[Error Handler] ${err.name || "Error"}: ${err.message}`);

  // Mongoose CastError (e.g. malformed ObjectId)
  if (err.name === "CastError") {
    return failure(res, 400, `Invalid ${err.path || "identifier"} format`);
  }

  // MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "resource";
    return failure(res, 409, `Duplicate entry: A record with this ${field} already exists`);
  }

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return failure(res, 400, messages.join(", ") || "Validation error");
  }

  // Zod Validation Error
  if (err.name === "ZodError" || err.issues) {
    const message = err.issues && err.issues[0] ? err.issues[0].message : "Validation error";
    return failure(res, 400, message);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return failure(res, 401, "Authentication token missing or invalid");
  }

  // Explicit status codes attached to errors
  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode >= 500 ? "Internal server error" : (err.message || "An unexpected error occurred");

  return failure(res, statusCode, message);
};

module.exports = errorHandler;
