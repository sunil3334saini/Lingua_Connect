const { query } = require("express-validator");

/** GET /api/search */
const searchTeachersRules = [
  query("subject")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Subject must be at most 100 characters"),
  query("minRating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("Minimum rating must be between 0 and 5"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum price must be non-negative"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum price must be non-negative")
    .custom((value, { req }) => {
      if (req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
        throw new Error("Maximum price must be greater than or equal to minimum price");
      }
      return true;
    }),
  query("minExperience")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum experience must be a non-negative integer"),
  query("sortBy")
    .optional()
    .isIn(["price_low", "price_high", "experience", "rating"])
    .withMessage("sortBy must be one of: price_low, price_high, experience, rating"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

module.exports = {
  searchTeachersRules,
};
