const Result = require("../models/Result");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Evaluation = require("../models/Evaluation");
const User = require("../models/User");

const generateLeaderboard = async () => {
  try {
    const submissions = await Submission.find({
      averageScore: { $ne: null },
    })
      .populate("teamId", "name")
      .sort({ averageScore: -1 })
      .lean();

    if (submissions.length === 0) {
      return [];
    }

    const leaderboard = [];
    let currentRank = 1;
    let previousScore = null;
    let teamsWithSameRank = 0;

    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];

      if (previousScore !== null && submission.averageScore === previousScore) {
        teamsWithSameRank++;
      } else {
        currentRank = i + 1;
        teamsWithSameRank = 0;
      }

      leaderboard.push({
        rank: currentRank,
        teamId: submission.teamId._id,
        teamName: submission.teamId.name,
        averageScore: parseFloat(submission.averageScore.toFixed(2)),
        evaluationCount: submission.evaluationCount,
      });

      previousScore = submission.averageScore;
    }

    return leaderboard;
  } catch (error) {
    throw new Error(`Error generating leaderboard: ${error.message}`);
  }
};

const publishResults = async (adminId) => {
  try {
    const allAssignments = await Assignment.find({});

    if (allAssignments.length === 0) {
      throw new Error(
        "No assignments found. Cannot publish results without team assignments."
      );
    }

    const incompleteAssignments = [];

    for (const assignment of allAssignments) {
      const evaluationCount = await Evaluation.countDocuments({
        teamId: assignment.teamId,
      });

      if (evaluationCount < 3) {
        const team = await User.findById(assignment.teamId).select("name");
        incompleteAssignments.push({
          teamId: assignment.teamId,
          teamName: team ? team.name : "Unknown Team",
          evaluationCount,
        });
      }
    }

    if (incompleteAssignments.length > 0) {
      throw new Error(
        `Cannot publish results. ${incompleteAssignments.length} team(s) do not have 3 completed evaluations. ` +
          `Incomplete teams: ${incompleteAssignments
            .map((t) => `${t.teamName} (${t.evaluationCount}/3)`)
            .join(", ")}`
      );
    }

    const leaderboard = await generateLeaderboard();

    if (leaderboard.length === 0) {
      throw new Error(
        "Cannot publish results. No teams have completed evaluations."
      );
    }

    let result = await Result.findOne({});

    if (result) {
      result.published = true;
      result.publishedAt = new Date();
      result.publishedBy = adminId;
      result.leaderboard = leaderboard;
      await result.save();
    } else {
      result = await Result.create({
        published: true,
        publishedAt: new Date(),
        publishedBy: adminId,
        leaderboard,
      });
    }

    return {
      success: true,
      message: "Results published successfully",
      publishedAt: result.publishedAt,
      leaderboard: result.leaderboard,
      totalTeams: leaderboard.length,
    };
  } catch (error) {
    throw new Error(`Error publishing results: ${error.message}`);
  }
};

const loadLeaderboard = async () => {
  try {
    const result = await Result.findOne({ published: true })
      .populate("publishedBy", "name email")
      .lean();

    if (!result) {
      return null;
    }

    return {
      published: result.published,
      publishedAt: result.publishedAt,
      publishedBy: result.publishedBy,
      leaderboard: result.leaderboard,
      totalTeams: result.leaderboard.length,
    };
  } catch (error) {
    throw new Error(`Error fetching published leaderboard: ${error.message}`);
  }
};

const checkEvaluationCompletion = async () => {
  try {
    const allAssignments = await Assignment.find({});
    const totalAssignments = allAssignments.length;

    if (totalAssignments === 0) {
      return {
        totalAssignments: 0,
        completedAssignments: 0,
        pendingAssignments: 0,
        completionPercentage: 0,
        totalEvaluationsRequired: 0,
        totalEvaluationsCompleted: 0,
        message: "No assignments found",
      };
    }

    let completedAssignments = 0;
    let totalEvaluationsCompleted = 0;
    const assignmentDetails = [];

    for (const assignment of allAssignments) {
      const evaluationCount = await Evaluation.countDocuments({
        teamId: assignment.teamId,
      });

      totalEvaluationsCompleted += evaluationCount;

      if (evaluationCount === 3) {
        completedAssignments++;
      }

      const team = await User.findById(assignment.teamId).select("name");
      assignmentDetails.push({
        teamId: assignment.teamId,
        teamName: team ? team.name : "Unknown Team",
        evaluationCount,
        isComplete: evaluationCount === 3,
      });
    }

    const pendingAssignments = totalAssignments - completedAssignments;
    const totalEvaluationsRequired = totalAssignments * 3;
    const completionPercentage =
      totalAssignments > 0
        ? parseFloat(
            ((completedAssignments / totalAssignments) * 100).toFixed(2)
          )
        : 0;

    return {
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      completionPercentage,
      totalEvaluationsRequired,
      totalEvaluationsCompleted,
      assignmentDetails,
      message:
        completedAssignments === totalAssignments
          ? "All evaluations complete. Ready to publish results."
          : `${pendingAssignments} team(s) still pending evaluation completion.`,
    };
  } catch (error) {
    throw new Error(`Error checking evaluation completion: ${error.message}`);
  }
};

module.exports = {
  generateLeaderboard,
  publishResults,
  loadLeaderboard,
  checkEvaluationCompletion,
};
