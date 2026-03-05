/**
 * Custom operational error class.
 *
 * Throw an AppError inside any controller / service and the centralized
 * error handler will format it into a consistent JSON response.
 *
 * Usage:
 *   throw new AppError("Booking not found", 404);
 *   throw new AppError("Slot already taken", 409);
 */
class AppError extends Error {
  /**
   * @param {string}  message    – Human-readable error description
   * @param {number}  statusCode – HTTP status code (default 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // trusted, expected errors

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
