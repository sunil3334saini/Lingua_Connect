const { body } = require("express-validator");

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm

/**
 * Shared availability slot validation (used in both create & update).
 */
const availabilityRules = [
  body("availability")
    .optional()
    .isArray()
    .withMessage("Availability must be an array"),
  body("availability.*.day")
    .isIn(DAYS)
    .withMessage(`Day must be one of: ${DAYS.join(", ")}`),
  body("availability.*.startTime")
    .matches(TIME_REGEX)
    .withMessage("Start time must be in HH:mm format"),
  body("availability.*.endTime")
    .matches(TIME_REGEX)
    .withMessage("End time must be in HH:mm format"),
];

/** POST /api/teacher/profile */
const createTeacherProfileRules = [
  body("subjects")
    .isArray({ min: 1 })
    .withMessage("At least one subject is required"),
  body("subjects.*")
    .trim()
    .notEmpty()
    .withMessage("Subject cannot be empty"),
  body("experience")
    .notEmpty()
    .withMessage("Experience is required")
    .isInt({ min: 0 })
    .withMessage("Experience must be a non-negative integer"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio must be at most 1000 characters"),
  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  ...availabilityRules,
];

/** PUT /api/teacher/profile */
const updateTeacherProfileRules = [
  body("subjects")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one subject is required"),
  body("subjects.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Subject cannot be empty"),
  body("experience")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Experience must be a non-negative integer"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio must be at most 1000 characters"),
  body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number"),
  ...availabilityRules,
];

module.exports = {
  createTeacherProfileRules,
  updateTeacherProfileRules,
};
