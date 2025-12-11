const mongoose = require("mongoose");

const leaderboardEntrySchema = new mongoose.Schema(
  {
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamName: {
      type: String,
      required: true,
    },
    averageScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    evaluationCount: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    published: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    leaderboard: {
      type: [leaderboardEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ published: 1 });

const Result = mongoose.model("Result", resultSchema);

module.exports = Result;
