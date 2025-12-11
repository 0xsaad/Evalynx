const Evaluation = require("../models/Evaluation");
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");

const calculateAverageScore = async (teamId) => {
  try {
    const evaluations = await Evaluation.find({ teamId });

    if (evaluations.length === 0) {
      return {
        averageScore: null,
        evaluationCount: 0,
        message: "No evaluations found for this team",
      };
    }

    const totalScore = evaluations.reduce(
      (sum, evaluation) => sum + evaluation.totalScore,
      0
    );
    const averageScore = totalScore / evaluations.length;
    const evaluationCount = evaluations.length;

    const submission = await Submission.findOne({ teamId });

    if (submission) {
      submission.evaluationCount = evaluationCount;
      submission.averageScore = averageScore;
      await submission.save();
    }

    return {
      averageScore: parseFloat(averageScore.toFixed(2)),
      evaluationCount,
      message:
        evaluationCount === 3
          ? "All evaluations complete"
          : `${evaluationCount}/3 evaluations complete`,
    };
  } catch (error) {
    throw new Error(`Error calculating average score: ${error.message}`);
  }
};

const getTeamEvaluations = async (teamId) => {
  try {
    const evaluations = await Evaluation.find({ teamId })
      .populate("evaluatorId", "name email expertise")
      .populate("submissionId", "videoUrl")
      .sort({ submittedAt: -1 });

    return evaluations;
  } catch (error) {
    throw new Error(`Error fetching team evaluations: ${error.message}`);
  }
};

const getEvaluatorProgress = async (evaluatorId) => {
  try {
    const assignments = await Assignment.find({
      evaluatorIds: evaluatorId,
    });

    const totalAssigned = assignments.length;

    const completedEvaluations = await Evaluation.countDocuments({
      evaluatorId,
    });

    const pendingEvaluations = totalAssigned - completedEvaluations;

    const completionPercentage =
      totalAssigned > 0
        ? parseFloat(((completedEvaluations / totalAssigned) * 100).toFixed(2))
        : 0;

    return {
      totalAssigned,
      completedEvaluations,
      pendingEvaluations,
      completionPercentage,
    };
  } catch (error) {
    throw new Error(`Error fetching evaluator progress: ${error.message}`);
  }
};

module.exports = {
  calculateAverageScore,
  getTeamEvaluations,
  getEvaluatorProgress,
};
