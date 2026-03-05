const { body } = require("express-validator");

/**
 * Reusable field-level rules that can be composed into route-specific sets.
 */
const fields = {
  name: body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  email: body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  phone: body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Please provide a valid phone number"),

  password: body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/\d/)
    .withMessage("Password must contain at least one number"),

  role: body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["student", "teacher", "admin"])
    .withMessage("Role must be student, teacher, or admin"),
};

/** POST /api/auth/register */
const registerRules = [
  fields.name,
  fields.email,
  fields.phone,
  fields.password,
  fields.role,
];

/** POST /api/auth/login */
const loginRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

/** PUT /api/auth/profile */
const updateProfileRules = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{6,14}$/)
    .withMessage("Please provide a valid phone number"),
];

module.exports = {
  registerRules,
  loginRules,
  updateProfileRules,
};
