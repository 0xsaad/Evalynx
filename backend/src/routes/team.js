const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { submissionLimiter } = require("../middleware/rateLimiter");
const {
  saveSubmission,
  getSubmission,
  getScores,
} = require("../controllers/teamController");
const {
  getTeamFeedback,
  countUnreadFb,
} = require("../controllers/feedbackController");

router.use(authenticate);

router.use(requireRole("team"));

router.post("/submission", submissionLimiter, saveSubmission);

router.get("/submission", getSubmission);

router.get("/scores", getScores);

router.get("/feedback", getTeamFeedback);

router.get("/feedback/unread-count", countUnreadFb);

module.exports = router;
