const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const { evaluationLimiter } = require("../middleware/rateLimiter");
const {
  getAssignments,
  submitEvaluation,
  getEvaluations,
} = require("../controllers/evaluatorController");
const {
  sendFeedback,
  getTeamEval,
} = require("../controllers/feedbackController");

router.use(authenticate);

router.use(requireRole("evaluator"));

router.get("/assignments", getAssignments);

router.post("/evaluate/:teamId", evaluationLimiter, submitEvaluation);

router.get("/evaluations", getEvaluations);

router.post("/feedback/:teamId", sendFeedback);

router.get("/feedback/:teamId", getTeamEval);

module.exports = router;
