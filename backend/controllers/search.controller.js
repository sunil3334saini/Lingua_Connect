const Teacher = require("../models/Teacher");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Search teachers by subject, rating, price, experience
// @route   GET /api/search?subject=english&minRating=3&maxPrice=500&minExperience=2
exports.searchTeachers = asyncHandler(async (req, res) => {
  const { subject, minRating, maxPrice, minPrice, minExperience, sortBy, page, limit } = req.query;

  const filter = {};

  if (subject) {
    filter.subjects = { $regex: new RegExp(subject, "i") };
  }
  if (minRating) {
    filter.rating = { $gte: parseFloat(minRating) };
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }
  if (minExperience) {
    filter.experience = { $gte: parseInt(minExperience) };
  }

  // Sorting
  let sort = { rating: -1 }; // default: highest rated
  if (sortBy === "price_low") sort = { price: 1 };
  if (sortBy === "price_high") sort = { price: -1 };
  if (sortBy === "experience") sort = { experience: -1 };

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const teachers = await Teacher.find(filter)
    .populate("userId", "name email profileImage")
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Teacher.countDocuments(filter);

  res.json({
    success: true,
    teachers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});
