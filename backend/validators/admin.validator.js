const { body, param, query } = require("express-validator");

// ─── Users ─────────────────────────────────────────────────────

const getUsersRules = [
  query("role")
    .optional()
    .isIn(["student", "teacher", "admin"])
    .withMessage("Role must be student, teacher, or admin"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search must be at most 100 characters"),
];

const getUserByIdRules = [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

const updateUserRules = [
  param("id").isMongoId().withMessage("Invalid user ID"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Please provide a valid phone number"),
  body("role")
    .optional()
    .isIn(["student", "teacher", "admin"])
    .withMessage("Role must be student, teacher, or admin"),
];

const deleteUserRules = [
  param("id").isMongoId().withMessage("Invalid user ID"),
];

// ─── Teachers ──────────────────────────────────────────────────

const getTeachersRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search must be at most 100 characters"),
];

const deleteTeacherRules = [
  param("id").isMongoId().withMessage("Invalid teacher ID"),
];

// ─── Bookings ──────────────────────────────────────────────────

const getBookingsRules = [
  query("status")
    .optional()
    .isIn(["upcoming", "ongoing", "completed", "cancelled"])
    .withMessage("Status must be upcoming, ongoing, completed, or cancelled"),
  query("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Payment status must be pending, paid, failed, or refunded"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

const updateBookingRules = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body("status")
    .optional()
    .isIn(["upcoming", "ongoing", "completed", "cancelled"])
    .withMessage("Status must be upcoming, ongoing, completed, or cancelled"),
  body("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Payment status must be pending, paid, failed, or refunded"),
];

const deleteBookingRules = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
];

// ─── Payments ──────────────────────────────────────────────────

const getPaymentsRules = [
  query("paymentStatus")
    .optional()
    .isIn(["pending", "paid", "failed", "refunded"])
    .withMessage("Payment status must be pending, paid, failed, or refunded"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

// ─── Availability ──────────────────────────────────────────────

const getAvailabilityRules = [
  param("id").isMongoId().withMessage("Invalid teacher ID"),
  query("date")
    .notEmpty()
    .withMessage("date query param is required")
    .isISO8601()
    .withMessage("date must be a valid ISO 8601 date (YYYY-MM-DD)"),
  query("slotMinutes")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("slotMinutes must be between 15 and 480"),
];

const getAvailabilityRangeRules = [
  param("id").isMongoId().withMessage("Invalid teacher ID"),
  query("from")
    .notEmpty()
    .withMessage("from query param is required")
    .isISO8601()
    .withMessage("from must be a valid ISO 8601 date (YYYY-MM-DD)"),
  query("days")
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage("days must be between 1 and 30"),
  query("slotMinutes")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("slotMinutes must be between 15 and 480"),
];

module.exports = {
  getUsersRules,
  getUserByIdRules,
  updateUserRules,
  deleteUserRules,
  getTeachersRules,
  deleteTeacherRules,
  getBookingsRules,
  updateBookingRules,
  deleteBookingRules,
  getPaymentsRules,
  getAvailabilityRules,
  getAvailabilityRangeRules,
};
