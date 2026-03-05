const express = require("express");
const router = express.Router();
const { createReview, getTeacherReviews } = require("../controllers/review.controller");
const { verifyToken, isStudent } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate");
const { createReviewRules, getTeacherReviewsRules } = require("../validators/review.validator");

router.post("/", verifyToken, isStudent, validate(createReviewRules), createReview);
router.get("/:teacherId", validate(getTeacherReviewsRules), getTeacherReviews);

module.exports = router;
