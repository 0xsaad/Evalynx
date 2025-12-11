const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const {
  getPendingEval,
  approveEvaluator,
  assignEvaluators,
  getAllTeams,
  getAllEvaluators,
  getAllAssignments,
  getAdminProfile,
  publishFinalResults,
  getEvaluationStatus,
  deleteUser,
} = require("../controllers/adminController");

router.use(authenticate);
router.use(requireRole("admin"));

router.get("/pending-evaluators", getPendingEval);
router.put("/approve-evaluator/:evaluatorId", approveEvaluator);

router.post("/assign-evaluators", assignEvaluators);
router.get("/assignments", getAllAssignments);

router.get("/teams", getAllTeams);
router.get("/evaluators", getAllEvaluators);
router.get("/profile", getAdminProfile);

router.post("/publish-results", publishFinalResults);

router.get("/evaluation-status", getEvaluationStatus);

router.delete("/users/:userId", deleteUser);

module.exports = router;
