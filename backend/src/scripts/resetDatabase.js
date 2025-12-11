const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const readline = require("readline");
const User = require("../models/User");
const Submission = require("../models/Submission");
const Evaluation = require("../models/Evaluation");
const Assignment = require("../models/Assignment");
const Result = require("../models/Result");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const resetDatabase = async () => {
  try {
    console.log("=== EvalynX Database Reset Script ===\n");
    console.log("⚠️  WARNING: This will delete ALL data from the database!\n");

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ MongoDB Connected\n");

    const answer = await askQuestion(
      "Are you sure you want to reset the database? (yes/no): "
    );

    if (answer.toLowerCase() !== "yes") {
      console.log("\n❌ Database reset cancelled");
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log("\n=== Clearing all collections ===\n");

    console.log("Deleting evaluations...");
    const evaluationsDeleted = await Evaluation.deleteMany({});
    console.log(`✓ Deleted ${evaluationsDeleted.deletedCount} evaluations`);

    console.log("Deleting assignments...");
    const assignmentsDeleted = await Assignment.deleteMany({});
    console.log(`✓ Deleted ${assignmentsDeleted.deletedCount} assignments`);

    console.log("Deleting submissions...");
    const submissionsDeleted = await Submission.deleteMany({});
    console.log(`✓ Deleted ${submissionsDeleted.deletedCount} submissions`);

    console.log("Deleting results...");
    const resultsDeleted = await Result.deleteMany({});
    console.log(`✓ Deleted ${resultsDeleted.deletedCount} results`);

    console.log("Deleting users...");
    const usersDeleted = await User.deleteMany({});
    console.log(`✓ Deleted ${usersDeleted.deletedCount} users`);

    console.log("\n=== Database cleared successfully ===\n");

    const seedAnswer = await askQuestion(
      "Would you like to seed sample data now? (yes/no): "
    );

    rl.close();

    if (seedAnswer.toLowerCase() === "yes") {
      console.log("\n=== Starting sample data seeding ===\n");
      await mongoose.connection.close();

      require("./seedSampleData");
    } else {
      console.log("\n✓ Database reset complete (no sample data added)");
      await mongoose.connection.close();
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Error resetting database:", error);
    rl.close();
    await mongoose.connection.close();
    process.exit(1);
  }
};

resetDatabase();
