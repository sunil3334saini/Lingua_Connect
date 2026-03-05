const { body, param } = require("express-validator");

/** POST /api/bookings */
const createBookingRules = [
  body("teacherProfileId")
    .notEmpty()
    .withMessage("Teacher profile ID is required")
    .isMongoId()
    .withMessage("Invalid teacher profile ID"),
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ max: 100 })
    .withMessage("Subject must be at most 100 characters"),
  body("sessionDate")
    .notEmpty()
    .withMessage("Session date is required")
    .isISO8601()
    .withMessage("Session date must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Session date must be in the future");
      }
      return true;
    }),
  body("sessionTime")
    .trim()
    .notEmpty()
    .withMessage("Session time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Session time must be in HH:mm format"),
  body("duration")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("Duration must be between 15 and 480 minutes"),
];

/** PUT /api/bookings/:id/status */
const updateBookingStatusRules = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["upcoming", "ongoing", "completed", "cancelled"])
    .withMessage("Status must be one of: upcoming, ongoing, completed, cancelled"),
];

/** GET /api/bookings/:id */
const getBookingByIdRules = [
  param("id").isMongoId().withMessage("Invalid booking ID"),
];

module.exports = {
  createBookingRules,
  updateBookingStatusRules,
  getBookingByIdRules,
};
