const express = require("express");
const router = express.Router();
const { searchTeachers } = require("../controllers/search.controller");
const { validate } = require("../middleware/validate");
const { searchTeachersRules } = require("../validators/search.validator");

router.get("/", validate(searchTeachersRules), searchTeachers);

module.exports = router;
