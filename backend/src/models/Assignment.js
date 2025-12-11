const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team ID is required"],
    },
    evaluatorIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      required: [true, "Evaluator IDs are required"],
      validate: {
        validator: function (evaluators) {
          if (evaluators.length !== 3) return false;
          const uniqueEvaluators = new Set(
            evaluators.map((id) => id.toString())
          );
          return uniqueEvaluators.size === 3;
        },
        message: "Must assign exactly 3 unique evaluators to each team",
      },
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned by admin ID is required"],
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ teamId: 1 }, { unique: true });
assignmentSchema.index({ evaluatorIds: 1 });
assignmentSchema.index({ status: 1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
