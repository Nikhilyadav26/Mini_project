const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { failure } = require("../utils/apiResponse");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) {
      return failure(res, 401, "Authentication token missing or invalid");
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match || !match[1] || match[1].trim() === "") {
      return failure(res, 401, "Authentication token missing or invalid");
    }

    const token = match[1].trim();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return failure(res, 500, "JWT secret configuration missing on server");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return failure(res, 401, "Authentication token missing or invalid");
    }

    if (!decoded || !decoded.userId) {
      return failure(res, 401, "Authentication token payload invalid");
    }

    const user = await User.findById(decoded.userId).select("-passwordHash");
    if (!user) {
      return failure(res, 401, "User not found or token invalid");
    }

    req.user = user;
    next();
  } catch (error) {
    return failure(res, 500, "Unexpected error in authentication middleware");
  }
};

module.exports = authenticateToken;
