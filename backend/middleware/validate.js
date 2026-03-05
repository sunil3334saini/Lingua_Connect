const { validationResult } = require("express-validator");

/**
 * Reusable validation middleware.
 * Runs the given express-validator chains and returns 422 on failure.
 *
 * Usage in routes:
 *   const { validate } = require("../middleware/validate");
 *   const { registerRules } = require("../validators/auth.validator");
 *   router.post("/register", validate(registerRules), controller);
 *
 * @param {import("express-validator").ValidationChain[]} validations
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validation chains in parallel
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  };
};

module.exports = { validate };
