const express = require("express");
const router = express.Router();
const {
  createProfile,
  getMyProfile,
  getTeacherById,
  getAllTeachers,
  updateProfile,
} = require("../controllers/teacher.controller");
const { uploadTeacherProfileImage } = require("../controllers/upload.controller");
const { getSlots, getRange } = require("../controllers/availability.controller");
const { verifyToken, isTeacher } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate");
const { createUpload } = require("../middleware/upload");
const { createTeacherProfileRules, updateTeacherProfileRules } = require("../validators/teacher.validator");
const { getAvailabilityRules, getAvailabilityRangeRules } = require("../validators/admin.validator");

const uploadProfileImage = createUpload({ folder: "lingua-connect/teacher-profiles" });

router.post("/profile", verifyToken, isTeacher, validate(createTeacherProfileRules), createProfile);
router.get("/profile/me", verifyToken, isTeacher, getMyProfile);
router.get("/all", getAllTeachers);

// Availability calendar endpoints (public — before /:id catch-all)
router.get("/:id/availability", validate(getAvailabilityRules), getSlots);
router.get("/:id/availability/range", validate(getAvailabilityRangeRules), getRange);

router.get("/:id", getTeacherById);
router.put("/profile", verifyToken, isTeacher, validate(updateTeacherProfileRules), updateProfile);
router.put("/profile-image", verifyToken, isTeacher, uploadProfileImage, uploadTeacherProfileImage);

module.exports = router;
