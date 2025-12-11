const User = require("../models/User");
const Assignment = require("../models/Assignment");

const autoAssign = async (adminId) => {
  try {
    const evaluators = await User.find({
      role: "evaluator",
      approved: true,
    }).select("_id name email");

    const teams = await User.find({
      role: "team",
    }).select("_id name email");

    if (evaluators.length < 3) {
      throw new Error(
        "Insufficient evaluators: At least 3 approved evaluators are required for assignment"
      );
    }

    if (teams.length === 0) {
      throw new Error(
        "No teams found: At least one team must be registered for assignment"
      );
    }

    const existingAssignments = await Assignment.countDocuments();
    if (existingAssignments > 0) {
      throw new Error(
        "Assignments already exist: Please clear existing assignments before running auto-assignment"
      );
    }

    const assignments = [];
    let evaluatorIndex = 0;

    for (const team of teams) {
      const assignedEvaluators = [];

      for (let i = 0; i < 3; i++) {
        assignedEvaluators.push(evaluators[evaluatorIndex]._id);

        evaluatorIndex = (evaluatorIndex + 1) % evaluators.length;
      }

      const assignment = new Assignment({
        teamId: team._id,
        evaluatorIds: assignedEvaluators,
        assignedBy: adminId,
        status: "active",
      });

      assignments.push(assignment);
    }

    const createdAssignments = await Assignment.insertMany(assignments);

    const workloadMap = await getEvaluatorWorkload();

    return {
      success: true,
      message: "Evaluators assigned successfully",
      statistics: {
        totalTeams: teams.length,
        totalEvaluators: evaluators.length,
        assignmentsCreated: createdAssignments.length,
        evaluatorsPerTeam: 3,
      },
      workloadDistribution: workloadMap,
    };
  } catch (error) {
    throw error;
  }
};

const manualAssign = async (teamId, evaluatorIds, adminId) => {
  try {
    const validation = await validateAssignment(teamId, evaluatorIds);

    if (!validation.valid) {
      throw new Error(validation.message);
    }

    let assignment = await Assignment.findOne({ teamId });

    if (assignment) {
      assignment.evaluatorIds = evaluatorIds;
      assignment.assignedBy = adminId;
      assignment.assignedAt = Date.now();
      await assignment.save();

      return {
        success: true,
        message: "Assignment updated successfully",
        assignment: await Assignment.findById(assignment._id)
          .populate("teamId", "name email")
          .populate("evaluatorIds", "name email"),
        isUpdate: true,
      };
    } else {
      assignment = new Assignment({
        teamId,
        evaluatorIds,
        assignedBy: adminId,
        status: "active",
      });

      await assignment.save();

      return {
        success: true,
        message: "Assignment created successfully",
        assignment: await Assignment.findById(assignment._id)
          .populate("teamId", "name email")
          .populate("evaluatorIds", "name email"),
        isUpdate: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

const validateAssignment = async (teamId, evaluatorIds) => {
  try {
    if (!Array.isArray(evaluatorIds) || evaluatorIds.length !== 3) {
      return {
        valid: false,
        message: "Must provide exactly 3 evaluators",
      };
    }

    const uniqueEvaluators = new Set(evaluatorIds.map((id) => id.toString()));
    if (uniqueEvaluators.size !== 3) {
      return {
        valid: false,
        message: "All 3 evaluators must be unique",
      };
    }

    const team = await User.findById(teamId);
    if (!team) {
      return {
        valid: false,
        message: "Team not found",
      };
    }

    if (team.role !== "team") {
      return {
        valid: false,
        message: "Specified user is not a team",
      };
    }

    const existingAssignment = await Assignment.findOne({ teamId });
    if (existingAssignment) {
      return {
        valid: false,
        message: "Team already has an assignment",
        existingAssignment,
      };
    }

    const evaluators = await User.find({
      _id: { $in: evaluatorIds },
      role: "evaluator",
    });

    if (evaluators.length !== 3) {
      return {
        valid: false,
        message: "One or more evaluators not found or not evaluator role",
      };
    }

    const unapprovedEvaluators = evaluators.filter((e) => !e.approved);
    if (unapprovedEvaluators.length > 0) {
      return {
        valid: false,
        message: "One or more evaluators are not approved",
        unapprovedEvaluators: unapprovedEvaluators.map((e) => ({
          id: e._id,
          name: e.name,
          email: e.email,
        })),
      };
    }

    return {
      valid: true,
      message: "Assignment is valid",
      team,
      evaluators,
    };
  } catch (error) {
    throw error;
  }
};

const getEvaluatorWorkload = async () => {
  try {
    const assignments = await Assignment.find({ status: "active" }).populate(
      "evaluatorIds",
      "name email"
    );

    const workloadMap = {};

    for (const assignment of assignments) {
      for (const evaluator of assignment.evaluatorIds) {
        const evaluatorId = evaluator._id.toString();

        if (!workloadMap[evaluatorId]) {
          workloadMap[evaluatorId] = {
            evaluatorId: evaluator._id,
            name: evaluator.name,
            email: evaluator.email,
            assignedTeams: 0,
          };
        }

        workloadMap[evaluatorId].assignedTeams += 1;
      }
    }

    const workloadArray = Object.values(workloadMap).sort(
      (a, b) => b.assignedTeams - a.assignedTeams
    );

    return {
      totalEvaluators: workloadArray.length,
      workload: workloadArray,
      averageWorkload:
        workloadArray.length > 0
          ? (
              workloadArray.reduce((sum, e) => sum + e.assignedTeams, 0) /
              workloadArray.length
            ).toFixed(2)
          : 0,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  autoAssign,
  manualAssign,
  validateAssignment,
  getEvaluatorWorkload,
};
