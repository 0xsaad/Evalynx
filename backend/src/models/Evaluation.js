const mongoose = require("mongoose");

const criterionSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: [true, "Score is required"],
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
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
    scores: {
      relevanceToLearning: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 5;
          },
          message: "Relevance to Learning score must be between 0 and 5",
        },
      },
      innovationCreativity: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 15;
          },
          message: "Innovation & Creativity score must be between 0 and 15",
        },
      },
      clarityAccessibility: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 10;
          },
          message: "Clarity & Accessibility score must be between 0 and 10",
        },
      },
      depth: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 5;
          },
          message: "Depth score must be between 0 and 5",
        },
      },
      interactivityEngagement: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 25;
          },
          message: "Interactivity & Engagement score must be between 0 and 25",
        },
      },
      useOfTechnology: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 5;
          },
          message: "Use of Technology score must be between 0 and 5",
        },
      },
      scalabilityAdaptability: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 10;
          },
          message: "Scalability & Adaptability score must be between 0 and 10",
        },
      },
      ethicalStandards: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 5;
          },
          message: "Ethical Standards score must be between 0 and 5",
        },
      },
      practicalApplication: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 10;
          },
          message: "Practical Application score must be between 0 and 10",
        },
      },
      videoQuality: {
        type: criterionSchema,
        required: true,
        validate: {
          validator: function (criterion) {
            return criterion.score >= 0 && criterion.score <= 10;
          },
          message: "Video Quality score must be between 0 and 10",
        },
      },
    },
    totalScore: {
      type: Number,
      min: [0, "Total score cannot be negative"],
      max: [100, "Total score cannot exceed 100"],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

evaluationSchema.index({ teamId: 1 });
evaluationSchema.index({ evaluatorId: 1 });
evaluationSchema.index({ teamId: 1, evaluatorId: 1 }, { unique: true }); // Compound unique index

evaluationSchema.pre("save", function (next) {
  const scores = this.scores;
  this.totalScore =
    scores.relevanceToLearning.score +
    scores.innovationCreativity.score +
    scores.clarityAccessibility.score +
    scores.depth.score +
    scores.interactivityEngagement.score +
    scores.useOfTechnology.score +
    scores.scalabilityAdaptability.score +
    scores.ethicalStandards.score +
    scores.practicalApplication.score +
    scores.videoQuality.score;

  next();
});

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

module.exports = Evaluation;
