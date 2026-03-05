/**
 * Wraps an async route handler so that rejected promises are
 * automatically forwarded to Express's next(err) — eliminating
 * the need for try/catch in every controller.
 *
 * Usage:
 *   const asyncHandler = require("../utils/asyncHandler");
 *   router.get("/users", asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
