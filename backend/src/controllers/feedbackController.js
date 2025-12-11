const Feedback = require("../models/Feedback");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");

const sendFeedback = async (req, res) => {
  try {
    const evaluatorId = req.user._id;
    const { teamId } = req.params;
    const { message, category } = req.body;

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Feedback message must be at least 10 characters long",
          code: "INVALID_MESSAGE",
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
          message: "You are not assigned to this team",
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

    const feedback = await Feedback.create({
      evaluatorId,
      teamId,
      submissionId: submission._id,
      message: message.trim(),
      category: category || "suggestion",
    });

    await feedback.populate("evaluatorId", "name email");

    return res.status(201).json({
      success: true,
      message: "Feedback sent successfully",
      data: {
        feedback: {
          _id: feedback._id,
          message: feedback.message,
          category: feedback.category,
          evaluatorName: feedback.evaluatorId.name,
          createdAt: feedback.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Error in sendFeedback:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: "VALIDATION_ERROR",
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to send feedback",
        code: "FEEDBACK_ERROR",
      },
    });
  }
};

const getTeamEval = async (req, res) => {
  try {
    const evaluatorId = req.user._id;
    const { teamId } = req.params;

    const feedbacks = await Feedback.find({
      evaluatorId,
      teamId,
    })
      .sort({ createdAt: -1 })
      .populate("teamId", "name email");

    return res.status(200).json({
      success: true,
      data: {
        feedbacks,
        count: feedbacks.length,
      },
    });
  } catch (error) {
    console.error("Error in getTeamEval:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch feedback",
        code: "FETCH_ERROR",
      },
    });
  }
};

const getTeamFeedback = async (req, res) => {
  try {
    const teamId = req.user._id;

    const feedbacks = await Feedback.find({ teamId })
      .sort({ createdAt: -1 })
      .populate("evaluatorId", "name email expertise");

    await Feedback.updateMany({ teamId, isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      data: {
        feedbacks,
        count: feedbacks.length,
      },
    });
  } catch (error) {
    console.error("Error in getTeamFeedback:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch feedback",
        code: "FETCH_ERROR",
      },
    });
  }
};

const countUnreadFb = async (req, res) => {
  try {
    const teamId = req.user._id;

    const count = await Feedback.countDocuments({
      teamId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error("Error in countUnreadFb:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch unread count",
        code: "FETCH_ERROR",
      },
    });
  }
};

module.exports = {
  sendFeedback,
  getTeamEval,
  getTeamFeedback,
  countUnreadFb,
};
