const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");
const { isAdmin } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate");

const admin = require("../controllers/admin.controller");
const v = require("../validators/admin.validator");

// All admin routes require authentication + admin role
router.use(verifyToken, isAdmin);

// ─── Dashboard ─────────────────────────────────────────────────
router.get("/stats", admin.getStats);

// ─── Users ─────────────────────────────────────────────────────
router.get("/users", validate(v.getUsersRules), admin.getUsers);
router.get("/users/:id", validate(v.getUserByIdRules), admin.getUserById);
router.put("/users/:id", validate(v.updateUserRules), admin.updateUser);
router.delete("/users/:id", validate(v.deleteUserRules), admin.deleteUser);

// ─── Teachers ──────────────────────────────────────────────────
router.get("/teachers", validate(v.getTeachersRules), admin.getTeachers);
router.delete("/teachers/:id", validate(v.deleteTeacherRules), admin.deleteTeacher);

// ─── Bookings ──────────────────────────────────────────────────
router.get("/bookings", validate(v.getBookingsRules), admin.getBookings);
router.put("/bookings/:id", validate(v.updateBookingRules), admin.updateBooking);
router.delete("/bookings/:id", validate(v.deleteBookingRules), admin.deleteBooking);

// ─── Payments ──────────────────────────────────────────────────
router.get("/payments", validate(v.getPaymentsRules), admin.getPayments);

module.exports = router;
