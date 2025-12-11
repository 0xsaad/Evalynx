const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    evaluatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Evaluator ID is required"],
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team ID is required"],
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      required: [true, "Submission ID is required"],
    },
    message: {
      type: String,
      required: [true, "Feedback message is required"],
      trim: true,
      minlength: [10, "Feedback must be at least 10 characters long"],
      maxlength: [2000, "Feedback cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      enum: ["suggestion", "improvement", "positive", "concern"],
      default: "suggestion",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ teamId: 1, createdAt: -1 });
feedbackSchema.index({ evaluatorId: 1, createdAt: -1 });
feedbackSchema.index({ teamId: 1, isRead: 1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
