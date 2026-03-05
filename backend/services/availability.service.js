const Teacher = require("../models/Teacher");
const Booking = require("../models/Booking");

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Parse "HH:mm" into total minutes from midnight.
 */
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Convert a Date to the day-of-week string used in the availability schema.
 * @param {Date} date
 * @returns {string}
 */
const getDayName = (date) => DAYS[date.getDay()];

/**
 * Build every possible slot for a given availability window and slot duration.
 *
 * Example: startTime "09:00", endTime "12:00", slotMinutes 60
 *  → ["09:00", "10:00", "11:00"]
 */
const generateTimeSlots = (startTime, endTime, slotMinutes = 60) => {
  const slots = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + slotMinutes <= end) {
    const hh = String(Math.floor(current / 60)).padStart(2, "0");
    const mm = String(current % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
    current += slotMinutes;
  }
  return slots;
};

/**
 * Get available time-slots for a teacher on a specific date.
 *
 * 1. Looks at the teacher's weekly availability for that day-of-week.
 * 2. Removes slots already booked (upcoming / ongoing).
 *
 * @param {string} teacherProfileId  - Teacher document _id
 * @param {string|Date} date         - The calendar date to check
 * @param {number} [slotMinutes=60]  - Slot length in minutes
 * @returns {Promise<{ day: string, date: string, slots: string[] }>}
 */
const getAvailableSlots = async (teacherProfileId, date, slotMinutes = 60) => {
  const targetDate = new Date(date);
  const dayName = getDayName(targetDate);

  // 1. Teacher's weekly windows for this day
  const teacher = await Teacher.findById(teacherProfileId).lean();
  if (!teacher) throw new Error("Teacher not found");

  const windows = teacher.availability.filter((a) => a.day === dayName);
  if (windows.length === 0) {
    return { day: dayName, date: targetDate.toISOString().slice(0, 10), slots: [] };
  }

  // 2. Merge all windows into candidate slots
  let allSlots = [];
  for (const w of windows) {
    allSlots.push(...generateTimeSlots(w.startTime, w.endTime, slotMinutes));
  }
  // Deduplicate & sort
  allSlots = [...new Set(allSlots)].sort();

  // 3. Fetch existing bookings for that date (only active ones)
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingBookings = await Booking.find({
    teacherProfileId,
    sessionDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["upcoming", "ongoing"] },
  })
    .select("sessionTime duration")
    .lean();

  // 4. Build a set of occupied minute-ranges
  const occupied = existingBookings.map((b) => {
    const start = timeToMinutes(b.sessionTime);
    return { start, end: start + (b.duration || 60) };
  });

  // 5. Filter out overlapping slots
  const freeSlots = allSlots.filter((slot) => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + slotMinutes;
    return !occupied.some(
      (o) => slotStart < o.end && slotEnd > o.start // overlap check
    );
  });

  return {
    day: dayName,
    date: targetDate.toISOString().slice(0, 10),
    slots: freeSlots,
  };
};

/**
 * Get available slots for a teacher over a date range.
 *
 * @param {string} teacherProfileId
 * @param {string|Date} fromDate
 * @param {number} [days=7]          - Number of days to look ahead
 * @param {number} [slotMinutes=60]
 * @returns {Promise<Array<{ day: string, date: string, slots: string[] }>>}
 */
const getAvailabilityRange = async (teacherProfileId, fromDate, days = 7, slotMinutes = 60) => {
  const start = new Date(fromDate);
  const results = [];

  for (let i = 0; i < days; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const daySlots = await getAvailableSlots(teacherProfileId, current, slotMinutes);
    results.push(daySlots);
  }

  return results;
};

/**
 * Check whether a specific time-slot is available for booking.
 *
 * @param {string} teacherProfileId
 * @param {string|Date} date
 * @param {string} time             - "HH:mm"
 * @param {number} [duration=60]    - Requested duration in minutes
 * @returns {Promise<boolean>}
 */
const isSlotAvailable = async (teacherProfileId, date, time, duration = 60) => {
  const targetDate = new Date(date);
  const dayName = getDayName(targetDate);

  // 1. Check teacher availability window
  const teacher = await Teacher.findById(teacherProfileId).lean();
  if (!teacher) return false;

  const windows = teacher.availability.filter((a) => a.day === dayName);
  const requestedStart = timeToMinutes(time);
  const requestedEnd = requestedStart + duration;

  const fitsWindow = windows.some((w) => {
    return requestedStart >= timeToMinutes(w.startTime) && requestedEnd <= timeToMinutes(w.endTime);
  });
  if (!fitsWindow) return false;

  // 2. Check for booking conflicts
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const conflicts = await Booking.countDocuments({
    teacherProfileId,
    sessionDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ["upcoming", "ongoing"] },
    $expr: {
      $let: {
        vars: {
          bStart: {
            $add: [
              { $multiply: [{ $toInt: { $substr: ["$sessionTime", 0, 2] } }, 60] },
              { $toInt: { $substr: ["$sessionTime", 3, 2] } },
            ],
          },
        },
        in: {
          $and: [
            { $lt: ["$$bStart", requestedEnd] },
            { $gt: [{ $add: ["$$bStart", "$duration"] }, requestedStart] },
          ],
        },
      },
    },
  });

  return conflicts === 0;
};

module.exports = {
  getAvailableSlots,
  getAvailabilityRange,
  isSlotAvailable,
  generateTimeSlots,
  timeToMinutes,
  getDayName,
};
