const { createLogger, format, transports } = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors, json } = format;

// ── Custom format for console output ───────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

// ── Log directory ──────────────────────────────────────────────
const LOG_DIR = path.join(__dirname, "..", "logs");

// ── Logger instance ────────────────────────────────────────────
const logger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }) // capture stack traces
  ),
  defaultMeta: { service: "lingua-connect" },

  transports: [
    // ── Console (colorized, human-readable) ─────────────────
    new transports.Console({
      format: combine(colorize(), consoleFormat),
    }),

    // ── Combined log file (all levels) ──────────────────────
    new transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      format: combine(json()),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),

    // ── Error-only log file ─────────────────────────────────
    new transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      format: combine(json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],

  // Don't crash on unhandled rejections; just log them
  exceptionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, "exceptions.log") }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(LOG_DIR, "rejections.log") }),
  ],
});

// ── Morgan stream adapter ──────────────────────────────────────
// Morgan writes HTTP logs as strings; pipe them into Winston at "http" level.
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
