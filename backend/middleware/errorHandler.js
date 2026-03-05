const logger = require("../config/logger");
const AppError = require("../utils/AppError");

// ── Mongoose-specific helpers ──────────────────────────────────

const handleCastError = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue).join(", ");
  return new AppError(`Duplicate value for field: ${field}. Please use another value.`, 409);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join(". ")}`, 400);
};

const handleJwtError = () => new AppError("Invalid token. Please log in again.", 401);

const handleJwtExpired = () => new AppError("Token has expired. Please log in again.", 401);

// ── Send response ──────────────────────────────────────────────

const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendProdError = (err, res) => {
  // Operational / trusted errors → send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Programming / unknown errors → don't leak details
  logger.error("UNEXPECTED ERROR 💥", err);
  res.status(500).json({
    success: false,
    status: "error",
    message: "Something went wrong",
  });
};

// ── Central error-handling middleware ───────────────────────────

/**
 * Express error middleware — must be registered AFTER all routes.
 * Signature: (err, req, res, next)
 */
const errorHandler = (err, req, res, _next) => {
  // Defaults
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log every error (with request context)
  logger.error(`${err.statusCode} - ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    ...(err.stack && { stack: err.stack }),
  });

  // Development: full details
  if (process.env.NODE_ENV === "development") {
    return sendDevError(err, res);
  }

  // Production: transform known error types into AppErrors
  let error = { ...err, message: err.message, stack: err.stack };

  if (err.name === "CastError") error = handleCastError(err);
  if (err.code === 11000) error = handleDuplicateKey(err);
  if (err.name === "ValidationError") error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJwtError();
  if (err.name === "TokenExpiredError") error = handleJwtExpired();

  sendProdError(error, res);
};

module.exports = errorHandler;
