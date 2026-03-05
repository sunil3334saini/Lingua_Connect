const { param, query, body } = require("express-validator");

/** GET /api/sessions/:id */
const getSessionByIdRules = [
  param("id").isMongoId().withMessage("Invalid session ID"),
];

/** GET /api/sessions/booking/:bookingId */
const getSessionByBookingIdRules = [
  param("bookingId").isMongoId().withMessage("Invalid booking ID"),
];

/** Shared pagination rules */
const paginationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["completed", "missed", "partial", "cancelled"])
    .withMessage("Status must be completed, missed, partial, or cancelled"),
];

/** PUT /api/sessions/:id/join */
const joinSessionRules = [
  param("id").isMongoId().withMessage("Invalid session ID"),
];

/** PUT /api/sessions/:id/end */
const endSessionRules = [
  param("id").isMongoId().withMessage("Invalid session ID"),
];

/** PUT /api/sessions/:id/notes */
const addNotesRules = [
  param("id").isMongoId().withMessage("Invalid session ID"),
  body("teacherNotes")
    .trim()
    .notEmpty()
    .withMessage("Teacher notes cannot be empty")
    .isLength({ max: 2000 })
    .withMessage("Notes must be at most 2000 characters"),
];

/** PUT /api/sessions/:id/recording */
const uploadRecordingRules = [
  param("id").isMongoId().withMessage("Invalid session ID"),
  body("duration")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Duration must be a non-negative integer (seconds)"),
];

/** DELETE /api/sessions/:id/recording/:recordingId */
const deleteRecordingRules = [
  param("id").isMongoId().withMessage("Invalid session ID"),
  param("recordingId").isMongoId().withMessage("Invalid recording ID"),
];

module.exports = {
  getSessionByIdRules,
  getSessionByBookingIdRules,
  paginationRules,
  joinSessionRules,
  endSessionRules,
  addNotesRules,
  uploadRecordingRules,
  deleteRecordingRules,
};
