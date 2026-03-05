const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile } = require("../controllers/auth.controller");
const { uploadUserProfileImage, deleteUserProfileImage } = require("../controllers/upload.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate");
const { createUpload } = require("../middleware/upload");
const { registerRules, loginRules, updateProfileRules } = require("../validators/auth.validator");

const uploadProfileImage = createUpload({ folder: "lingua-connect/profiles" });

router.post("/register", validate(registerRules), register);
router.post("/login", validate(loginRules), login);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, validate(updateProfileRules), updateProfile);
router.put("/profile-image", verifyToken, uploadProfileImage, uploadUserProfileImage);
router.delete("/profile-image", verifyToken, deleteUserProfileImage);

module.exports = router;
