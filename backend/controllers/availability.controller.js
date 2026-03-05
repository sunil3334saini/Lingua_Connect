const { getAvailableSlots, getAvailabilityRange } = require("../services/availability.service");

// @desc    Get available slots for a teacher on a specific date
// @route   GET /api/teacher/:id/availability?date=2026-03-10&slotMinutes=60
exports.getSlots = async (req, res) => {
  try {
    const { date, slotMinutes } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: "date query param is required (YYYY-MM-DD)" });
    }

    const result = await getAvailableSlots(
      req.params.id,
      date,
      slotMinutes ? parseInt(slotMinutes, 10) : 60
    );

    res.json({ success: true, availability: result });
  } catch (error) {
    if (error.message === "Teacher not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get available slots for a teacher over a date range
// @route   GET /api/teacher/:id/availability/range?from=2026-03-10&days=7&slotMinutes=60
exports.getRange = async (req, res) => {
  try {
    const { from, days, slotMinutes } = req.query;

    if (!from) {
      return res.status(400).json({ success: false, message: "from query param is required (YYYY-MM-DD)" });
    }

    const result = await getAvailabilityRange(
      req.params.id,
      from,
      days ? parseInt(days, 10) : 7,
      slotMinutes ? parseInt(slotMinutes, 10) : 60
    );

    res.json({ success: true, availability: result });
  } catch (error) {
    if (error.message === "Teacher not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
