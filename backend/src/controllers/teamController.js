const Submission = require("../models/Submission");
const Evaluation = require("../models/Evaluation");
const User = require("../models/User");

const saveSubmission = async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const teamId = req.user._id;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Video URL is required",
          code: "MISSING_VIDEO_URL",
        },
      });
    }

    let submission = await Submission.findOne({ teamId });

    if (submission) {
      submission.videoUrl = videoUrl;
      submission.updatedAt = Date.now();
      await submission.save();

      return res.status(200).json({
        success: true,
        message: "Submission updated successfully",
        data: {
          submission: {
            _id: submission._id,
            videoUrl: submission.videoUrl,
            submittedAt: submission.submittedAt,
            updatedAt: submission.updatedAt,
            evaluationCount: submission.evaluationCount,
            averageScore: submission.averageScore,
          },
        },
      });
    } else {
      submission = await Submission.create({
        teamId,
        videoUrl,
        submittedAt: Date.now(),
      });

      return res.status(201).json({
        success: true,
        message: "Submission created successfully",
        data: {
          submission: {
            _id: submission._id,
            videoUrl: submission.videoUrl,
            submittedAt: submission.submittedAt,
            updatedAt: submission.updatedAt,
            evaluationCount: submission.evaluationCount,
            averageScore: submission.averageScore,
          },
        },
      });
    }
  } catch (error) {
    console.error("Error in saveSubmission:", error);

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
        message: "Failed to create/update submission",
        code: "SUBMISSION_ERROR",
      },
    });
  }
};

const getSubmission = async (req, res) => {
  try {
    const teamId = req.user._id;

    const submission = await Submission.findOne({ teamId });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          message: "No submission found for this team",
          code: "SUBMISSION_NOT_FOUND",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        submission: {
          _id: submission._id,
          videoUrl: submission.videoUrl,
          submittedAt: submission.submittedAt,
          updatedAt: submission.updatedAt,
          evaluationCount: submission.evaluationCount,
          averageScore: submission.averageScore,
        },
      },
    });
  } catch (error) {
    console.error("Error in getSubmission:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch submission",
        code: "FETCH_ERROR",
      },
    });
  }
};

const getScores = async (req, res) => {
  try {
    const teamId = req.user._id;

    const submission = await Submission.findOne({ teamId });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: {
          message: "No submission found. Please submit your video first.",
          code: "SUBMISSION_NOT_FOUND",
        },
      });
    }

    const evaluations = await Evaluation.find({ teamId })
      .populate("evaluatorId", "name email")
      .sort({ submittedAt: -1 });

    if (evaluations.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No evaluations available yet",
        data: {
          evaluations: [],
          averageScore: null,
          evaluationCount: 0,
          breakdown: null,
          status: "pending",
        },
      });
    }

    const criteriaNames = [
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

    const breakdown = {};
    criteriaNames.forEach((criterion) => {
      const scores = evaluations.map((e) => e.scores[criterion].score);
      const avgScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;

      const comments = evaluations
        .map((e) => ({
          evaluator: e.evaluatorId.name,
          comment: e.scores[criterion].comment,
        }))
        .filter((item) => item.comment && item.comment.trim() !== "");

      breakdown[criterion] = {
        averageScore: parseFloat(avgScore.toFixed(2)),
        comments,
      };
    });

    const formattedEvaluations = evaluations.map((evaluation) => ({
      evaluatorName: evaluation.evaluatorId.name,
      evaluatorEmail: evaluation.evaluatorId.email,
      totalScore: evaluation.totalScore,
      submittedAt: evaluation.submittedAt,
      scores: evaluation.scores,
    }));

    return res.status(200).json({
      success: true,
      data: {
        evaluations: formattedEvaluations,
        averageScore: submission.averageScore,
        evaluationCount: submission.evaluationCount,
        breakdown,
        status: submission.evaluationCount === 3 ? "completed" : "in_progress",
      },
    });
  } catch (error) {
    console.error("Error in getScores:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch scores",
        code: "FETCH_ERROR",
      },
    });
  }
};

module.exports = {
  saveSubmission,
  getSubmission,
  getScores,
};
