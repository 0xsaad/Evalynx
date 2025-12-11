const Assignment = require("../models/Assignment");
const Evaluation = require("../models/Evaluation");
const Submission = require("../models/Submission");
const User = require("../models/User");

const getAssignments = async (req, res) => {
  try {
    const evaluatorId = req.user._id;

    const assignments = await Assignment.find({
      evaluatorIds: evaluatorId,
      status: "active",
    }).populate("teamId", "name email");

    if (!assignments || assignments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No teams assigned yet",
        data: {
          assignments: [],
        },
      });
    }

    const teamIds = assignments.map((assignment) => assignment.teamId._id);

    const submissions = await Submission.find({
      teamId: { $in: teamIds },
    });

    const evaluations = await Evaluation.find({
      evaluatorId,
      teamId: { $in: teamIds },
    });

    const submissionMap = {};
    submissions.forEach((sub) => {
      submissionMap[sub.teamId.toString()] = sub;
    });

    const evaluationMap = {};
    evaluations.forEach((evaluationItem) => {
      evaluationMap[evaluationItem.teamId.toString()] = evaluationItem;
    });

    const formattedAssignments = assignments.map((assignment) => {
      const teamId = assignment.teamId._id.toString();
      const submission = submissionMap[teamId];
      const evaluation = evaluationMap[teamId];

      return {
        teamId: assignment.teamId._id,
        teamName: assignment.teamId.name,
        teamEmail: assignment.teamId.email,
        videoUrl: submission ? submission.videoUrl : null,
        submittedAt: submission ? submission.submittedAt : null,
        evaluated: !!evaluation,
        evaluationSubmittedAt: evaluation ? evaluation.submittedAt : null,
        assignedAt: assignment.assignedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        assignments: formattedAssignments,
        totalAssigned: formattedAssignments.length,
        completed: formattedAssignments.filter((a) => a.evaluated).length,
        pending: formattedAssignments.filter((a) => !a.evaluated).length,
      },
    });
  } catch (error) {
    console.error("Error in getAssignments:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch assignments",
        code: "FETCH_ERROR",
      },
    });
  }
};

const submitEvaluation = async (req, res) => {
  try {
    const evaluatorId = req.user._id;
    const { teamId } = req.params;
    const { scores } = req.body;

    if (!scores) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Scores are required",
          code: "MISSING_SCORES",
        },
      });
    }

    const assignment = await Assignment.findOne({
      teamId,
      evaluatorIds: evaluatorId,
      status: "active",
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        error: {
          message: "You are not assigned to evaluate this team",
          code: "NOT_ASSIGNED",
        },
      });
    }

    const team = await User.findOne({ _id: teamId, role: "team" });
    if (!team) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Team not found",
          code: "TEAM_NOT_FOUND",
        },
      });
    }

    const submission = await Submission.findOne({ teamId });
    if (!submission) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Team has not submitted their video yet",
          code: "NO_SUBMISSION",
        },
      });
    }

    const existingEvaluation = await Evaluation.findOne({
      evaluatorId,
      teamId,
    });

    if (existingEvaluation) {
      return res.status(409).json({
        success: false,
        error: {
          message: "You have already evaluated this team",
          code: "DUPLICATE_EVALUATION",
        },
      });
    }

    const requiredCriteria = [
      "relevanceToLearning",
      "innovationCreativity",
      "clarityAccessibility",
      "depth",
      "interactivityEngagement",
      "useOfTechnology",
      "scalabilityAdaptability",
      "ethicalStandards",
      "practicalApplication",
      "videoQuality",
    ];

    for (const criterion of requiredCriteria) {
      if (!scores[criterion] || typeof scores[criterion].score !== "number") {
        return res.status(400).json({
          success: false,
          error: {
            message: `Score for ${criterion} is required`,
            code: "MISSING_CRITERION",
          },
        });
      }
    }

    const evaluation = await Evaluation.create({
      evaluatorId,
      teamId,
      submissionId: submission._id,
      scores: {
        relevanceToLearning: {
          score: scores.relevanceToLearning.score,
          comment: scores.relevanceToLearning.comment || "",
        },
        innovationCreativity: {
          score: scores.innovationCreativity.score,
          comment: scores.innovationCreativity.comment || "",
        },
        clarityAccessibility: {
          score: scores.clarityAccessibility.score,
          comment: scores.clarityAccessibility.comment || "",
        },
        depth: {
          score: scores.depth.score,
          comment: scores.depth.comment || "",
        },
        interactivityEngagement: {
          score: scores.interactivityEngagement.score,
          comment: scores.interactivityEngagement.comment || "",
        },
        useOfTechnology: {
          score: scores.useOfTechnology.score,
          comment: scores.useOfTechnology.comment || "",
        },
        scalabilityAdaptability: {
          score: scores.scalabilityAdaptability.score,
          comment: scores.scalabilityAdaptability.comment || "",
        },
        ethicalStandards: {
          score: scores.ethicalStandards.score,
          comment: scores.ethicalStandards.comment || "",
        },
        practicalApplication: {
          score: scores.practicalApplication.score,
          comment: scores.practicalApplication.comment || "",
        },
        videoQuality: {
          score: scores.videoQuality.score,
          comment: scores.videoQuality.comment || "",
        },
      },
    });

    submission.evaluationCount += 1;

    if (submission.evaluationCount === 3) {
      const allEvaluations = await Evaluation.find({ teamId });
      const totalScore = allEvaluations.reduce(
        (sum, eItem) => sum + eItem.totalScore,
        0
      );
      submission.averageScore = parseFloat((totalScore / 3).toFixed(2));
    }

    await submission.save();

    return res.status(201).json({
      success: true,
      message: "Evaluation submitted successfully",
      data: {
        evaluation: {
          _id: evaluation._id,
          teamId: evaluation.teamId,
          totalScore: evaluation.totalScore,
          submittedAt: evaluation.submittedAt,
        },
        submissionStatus: {
          evaluationCount: submission.evaluationCount,
          averageScore: submission.averageScore,
        },
      },
    });
  } catch (error) {
    console.error("Error in submitEvaluation:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: "VALIDATION_ERROR",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to submit evaluation",
        code: "EVALUATION_ERROR",
      },
    });
  }
};

const getEvaluations = async (req, res) => {
  try {
    const evaluatorId = req.user._id;

    const evaluations = await Evaluation.find({ evaluatorId })
      .populate("teamId", "name email")
      .sort({ submittedAt: -1 });

    if (!evaluations || evaluations.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No evaluations submitted yet",
        data: {
          evaluations: [],
        },
      });
    }

    const formattedEvaluations = evaluations.map((evaluation) => ({
      _id: evaluation._id,
      teamId: evaluation.teamId._id,
      teamName: evaluation.teamId.name,
      teamEmail: evaluation.teamId.email,
      totalScore: evaluation.totalScore,
      scores: evaluation.scores,
      submittedAt: evaluation.submittedAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        evaluations: formattedEvaluations,
        totalEvaluations: formattedEvaluations.length,
      },
    });
  } catch (error) {
    console.error("Error in getEvaluations:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch evaluations",
        code: "FETCH_ERROR",
      },
    });
  }
};

module.exports = {
  getAssignments,
  submitEvaluation,
  getEvaluations,
};
