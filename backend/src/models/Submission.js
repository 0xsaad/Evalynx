const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team ID is required"],
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
      trim: true,
      validate: {
        validator: function (url) {
          try {
            const urlObj = new URL(url);
            return urlObj.protocol === "http:" || urlObj.protocol === "https:";
          } catch (e) {
            return false;
          }
        },
        message: "Please provide a valid video URL",
      },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    evaluationCount: {
      type: Number,
      default: 0,
      min: [0, "Evaluation count cannot be negative"],
      max: [3, "Maximum 3 evaluations per team"],
    },
    averageScore: {
      type: Number,
      default: null,
      min: [0, "Score cannot be negative"],
      max: [100, "Score cannot exceed 100"],
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ teamId: 1 }, { unique: true });
submissionSchema.index({ averageScore: -1 }); // For leaderboard sorting (descending)

submissionSchema.pre("save", function (next) {
  if (this.isModified("videoUrl")) {
    this.updatedAt = Date.now();
  }
  next();
});

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;
