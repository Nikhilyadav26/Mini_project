/**
 * Campus Connect - Shared API Response Helper
 * Conforms to Master Backend Contract Section 7
 */

function success(res, statusCode = 200, message = "Operation successful", data = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data !== undefined ? data : {}
  });
}

function failure(res, statusCode = 500, message = "An error occurred") {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = {
  success,
  failure
};
