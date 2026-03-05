const { body, param, query } = require("express-validator");

/** POST /api/reviews */
const createReviewRules = [
  body("bookingId")
    .notEmpty()
    .withMessage("Booking ID is required")
    .isMongoId()
    .withMessage("Invalid booking ID"),
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment must be at most 500 characters"),
];

/** GET /api/reviews/:teacherId */
const getTeacherReviewsRules = [
  param("teacherId").isMongoId().withMessage("Invalid teacher ID"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

module.exports = {
  createReviewRules,
  getTeacherReviewsRules,
};
