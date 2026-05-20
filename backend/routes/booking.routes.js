const express = require("express");
const router = express.Router();
const {
  createBooking,
  getStudentBookings,
  getTeacherBookings,
  updateBookingStatus,
  getBookingById,
  cancelBooking,
} = require("../controllers/booking.controller");
const { verifyToken, isStudent, isTeacher } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate");
const { createBookingRules, updateBookingStatusRules, getBookingByIdRules, cancelBookingRules } = require("../validators/booking.validator");

router.post("/", verifyToken, isStudent, validate(createBookingRules), createBooking);
router.get("/student", verifyToken, isStudent, getStudentBookings);
router.get("/teacher", verifyToken, isTeacher, getTeacherBookings);
router.put("/:id/status", verifyToken, validate(updateBookingStatusRules), updateBookingStatus);
router.delete("/:id", verifyToken, validate(cancelBookingRules), cancelBooking);
router.get("/:id", verifyToken, validate(getBookingByIdRules), getBookingById);

module.exports = router;
