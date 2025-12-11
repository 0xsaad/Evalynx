const User = require("../models/User");
const Assignment = require("../models/Assignment");
const { autoAssign, manualAssign } = require("../services/assignmentService");
const {
  publishResults,
  checkEvaluationCompletion,
} = require("../services/leaderboardService");

const getPendingEval = async (req, res) => {
  try {
    const pendingEvaluators = await User.find({
      role: "evaluator",
      approved: false,
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pendingEvaluators.length,
      evaluators: pendingEvaluators,
    });
  } catch (error) {
    console.error("Error fetching pending evaluators:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch pending evaluators",
        code: "FETCH_ERROR",
      },
    });
  }
};

const approveEvaluator = async (req, res) => {
  try {
    const { evaluatorId } = req.params;
    const { approved } = req.body;

    if (typeof approved !== "boolean") {
      return res.status(400).json({
        success: false,
        error: {
          message: "Please provide approved status as boolean (true or false)",
          code: "INVALID_INPUT",
        },
      });
    }

    const evaluator = await User.findById(evaluatorId);

    if (!evaluator) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Evaluator not found",
          code: "EVALUATOR_NOT_FOUND",
        },
      });
    }

    if (evaluator.role !== "evaluator") {
      return res.status(400).json({
        success: false,
        error: {
          message: "User is not an evaluator",
          code: "INVALID_ROLE",
        },
      });
    }

    if (evaluator.approved === approved) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Evaluator is already ${approved ? "approved" : "rejected"}`,
          code: "ALREADY_PROCESSED",
        },
      });
    }

    if (approved) {
      evaluator.approved = true;
      await evaluator.save();

      res.status(200).json({
        success: true,
        message: "Evaluator approved successfully",
        evaluator: {
          id: evaluator._id,
          name: evaluator.name,
          email: evaluator.email,
          expertise: evaluator.expertise,
          approved: evaluator.approved,
        },
      });
    } else {
      await User.findByIdAndDelete(evaluatorId);

      res.status(200).json({
        success: true,
        message: "Evaluator rejected and removed from system",
      });
    }
  } catch (error) {
    console.error("Error approving/rejecting evaluator:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to process evaluator approval",
        code: "APPROVAL_ERROR",
      },
    });
  }
};

const assignEvaluators = async (req, res) => {
  try {
    const { mode, manual } = req.body;
    const adminId = req.user._id;

    if (!mode || !["auto", "manual"].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide valid mode: "auto" or "manual"',
          code: "INVALID_MODE",
        },
      });
    }

    if (mode === "auto") {
      const result = await autoAssign(adminId);

      return res.status(200).json({
        success: true,
        message: result.message,
        mode: "auto",
        statistics: result.statistics,
        workloadDistribution: result.workloadDistribution,
      });
    } else if (mode === "manual") {
      if (!manual || !Array.isArray(manual) || manual.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "Please provide manual assignment data as array of {teamId, evaluatorIds}",
            code: "INVALID_MANUAL_DATA",
          },
        });
      }

      const results = [];
      const errors = [];

      for (const assignment of manual) {
        const { teamId, evaluatorIds } = assignment;

        if (!teamId || !evaluatorIds || !Array.isArray(evaluatorIds)) {
          errors.push({
            teamId: teamId || "unknown",
            error:
              "Invalid assignment data: teamId and evaluatorIds array required",
          });
          continue;
        }

        try {
          const result = await manualAssign(teamId, evaluatorIds, adminId);
          results.push({
            teamId,
            success: true,
            message: result.message,
            assignment: result.assignment,
          });
        } catch (error) {
          errors.push({
            teamId,
            error: error.message,
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Manual assignment completed",
        mode: "manual",
        results,
        errors,
        summary: {
          total: manual.length,
          successful: results.length,
          failed: errors.length,
        },
      });
    }
  } catch (error) {
    console.error("Error assigning evaluators:", error);

    res.status(500).json({
      success: false,
      error: {
        message: error.message || "Failed to assign evaluators",
        code: "ASSIGNMENT_ERROR",
      },
    });
  }
};

const getAllTeams = async (req, res) => {
  try {
    const teams = await User.find({ role: "team" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch teams",
        code: "FETCH_ERROR",
      },
    });
  }
};

const getAllEvaluators = async (req, res) => {
  try {
    const evaluators = await User.find({ role: "evaluator" })
      .select("-password")
      .sort({ approved: -1, createdAt: -1 });

    const approved = evaluators.filter((e) => e.approved);
    const pending = evaluators.filter((e) => !e.approved);

    res.status(200).json({
      success: true,
      count: evaluators.length,
      evaluators,
      summary: {
        total: evaluators.length,
        approved: approved.length,
        pending: pending.length,
      },
    });
  } catch (error) {
    console.error("Error fetching evaluators:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch evaluators",
        code: "FETCH_ERROR",
      },
    });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: {
          message: "Admin not found",
          code: "ADMIN_NOT_FOUND",
        },
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        passwordChangedAt: admin.passwordChangedAt,
        createdAt: admin.createdAt,
        isFirstLogin: admin.isFirstLogin,
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch admin profile",
        code: "FETCH_ERROR",
      },
    });
  }
};

const publishFinalResults = async (req, res) => {
  try {
    const adminId = req.user._id;

    const result = await publishResults(adminId);

    res.status(200).json({
      success: true,
      message: result.message,
      publishedAt: result.publishedAt,
      leaderboard: result.leaderboard,
      totalTeams: result.totalTeams,
    });
  } catch (error) {
    console.error("Error publishing results:", error);

    res.status(400).json({
      success: false,
      error: {
        message: error.message || "Failed to publish results",
        code: "PUBLISH_ERROR",
      },
    });
  }
};

const getEvaluationStatus = async (req, res) => {
  try {
    const status = await checkEvaluationCompletion();

    res.status(200).json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error("Error fetching evaluation status:", error);

    res.status(500).json({
      success: false,
      error: {
        message: error.message || "Failed to fetch evaluation status",
        code: "FETCH_ERROR",
      },
    });
  }
};

const getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({})
      .sort({ createdAt: -1 })
      .lean();

    const formattedAssignments = assignments.map((assignment) => ({
      ...assignment,
      teamId: assignment.teamId.toString(),
      evaluatorIds: assignment.evaluatorIds.map((id) => id.toString()),
      assignedBy: assignment.assignedBy
        ? assignment.assignedBy.toString()
        : null,
    }));

    res.status(200).json({
      success: true,
      count: formattedAssignments.length,
      assignments: formattedAssignments,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch assignments",
        code: "FETCH_ERROR",
      },
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: "User not found",
          code: "USER_NOT_FOUND",
        },
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        error: {
          message: "Cannot delete admin users",
          code: "FORBIDDEN",
        },
      });
    }

    if (user.role === "evaluator") {
      await Assignment.updateMany(
        { evaluatorIds: userId },
        { $pull: { evaluatorIds: userId } }
      );
    }

    if (user.role === "team") {
      await Assignment.deleteMany({ teamId: userId });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: `${
        user.role === "team" ? "Team" : "Evaluator"
      } deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Failed to delete user",
        code: "DELETE_ERROR",
      },
    });
  }
};

module.exports = {
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
};
