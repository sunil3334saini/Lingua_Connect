const rateLimit = require("express-rate-limit");

/**
 * Reusable rate-limiter factory.
 *
 * Usage:
 *   const { createLimiter, authLimiter, apiLimiter } = require("./rateLimiter");
 *   app.use("/api/auth", authLimiter);         // pre-built strict limiter
 *   app.use("/api", apiLimiter);                // pre-built general limiter
 *   app.use("/api/custom", createLimiter(...)); // custom one-off
 *
 * @param {Object} options
 * @param {number}  options.windowMs  – Time window in ms (default 15 min)
 * @param {number}  options.max       – Max requests per window (default 100)
 * @param {string}  options.message   – Error message text
 * @returns {import("express").RequestHandler}
 */
const createLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests, please try again later.",
} = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,  // Disable `X-RateLimit-*` headers
    message: { success: false, message },
  });

// ── Pre-built limiters ─────────────────────────────────────────

/** Strict limiter for auth routes (login / register) – 15 req / 15 min */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts. Please try again after 15 minutes.",
});

/** General API limiter – 100 req / 15 min per IP */
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP. Please try again later.",
});

/** Upload limiter – 10 uploads / 15 min */
const uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many upload requests. Please try again later.",
});

/** Payment limiter – 20 req / 15 min */
const paymentLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many payment requests. Please try again later.",
});

module.exports = {
  createLimiter,
  authLimiter,
  apiLimiter,
  uploadLimiter,
  paymentLimiter,
};
