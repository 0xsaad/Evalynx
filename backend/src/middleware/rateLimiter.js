const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    error: {
      message: "Too many requests from this IP, please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      message:
        "Too many authentication attempts, please try again after 15 minutes.",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      message: "Too many submissions, please try again later.",
      code: "SUBMISSION_RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

const evaluationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      message: "Too many evaluations, please try again later.",
      code: "EVALUATION_RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

const applyRateLimiting = (app) => {
  const enableRateLimit = process.env.ENABLE_RATE_LIMIT !== "false";

  if (enableRateLimit) {
    app.use("/api/", apiLimiter);
    console.log("✓ Rate limiting enabled");
  } else {
    console.log("⚠ Rate limiting disabled");
  }
};

module.exports = {
  apiLimiter,
  authLimiter,
  submissionLimiter,
  evaluationLimiter,
  applyRateLimiting,
};
