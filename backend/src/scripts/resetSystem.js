const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const readline = require("readline");

const User = require("../models/User");
const Submission = require("../models/Submission");
const Evaluation = require("../models/Evaluation");
const Assignment = require("../models/Assignment");
const Result = require("../models/Result");
const ChatMessage = require("../models/ChatMessage");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ MongoDB Connected");
  } catch (error) {
    console.error("✗ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const resetSystem = async () => {
  try {
    console.log("\n🔄 Starting System Reset...\n");

    const teamsDeleted = await User.deleteMany({ role: "team" });
    console.log(`✓ Deleted ${teamsDeleted.deletedCount} teams`);

    const evaluatorsDeleted = await User.deleteMany({ role: "evaluator" });
    console.log(`✓ Deleted ${evaluatorsDeleted.deletedCount} evaluators`);

    const submissionsDeleted = await Submission.deleteMany({});
    console.log(`✓ Deleted ${submissionsDeleted.deletedCount} submissions`);

    const evaluationsDeleted = await Evaluation.deleteMany({});
    console.log(`✓ Deleted ${evaluationsDeleted.deletedCount} evaluations`);

    const assignmentsDeleted = await Assignment.deleteMany({});
    console.log(`✓ Deleted ${assignmentsDeleted.deletedCount} assignments`);

    const resultsDeleted = await Result.deleteMany({});
    console.log(`✓ Deleted ${resultsDeleted.deletedCount} results`);

    const chatMessagesDeleted = await ChatMessage.deleteMany({});
    console.log(`✓ Deleted ${chatMessagesDeleted.deletedCount} chat messages`);

    const adminCount = await User.countDocuments({ role: "admin" });
    console.log(`✓ Admin accounts preserved: ${adminCount}`);

    console.log("\n✅ System reset completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Teams deleted: ${teamsDeleted.deletedCount}`);
    console.log(`   - Evaluators deleted: ${evaluatorsDeleted.deletedCount}`);
    console.log(`   - Submissions deleted: ${submissionsDeleted.deletedCount}`);
    console.log(`   - Evaluations deleted: ${evaluationsDeleted.deletedCount}`);
    console.log(`   - Assignments deleted: ${assignmentsDeleted.deletedCount}`);
    console.log(`   - Results deleted: ${resultsDeleted.deletedCount}`);
    console.log(
      `   - Chat messages deleted: ${chatMessagesDeleted.deletedCount}`
    );
    console.log(`   - Admin accounts: ${adminCount} (preserved)\n`);

    console.log(
      "🎯 The system is now ready for a new evaluation examination!\n"
    );
  } catch (error) {
    console.error("\n✗ Error during system reset:", error);
    throw error;
  }
};

const confirmReset = () => {
  return new Promise((resolve) => {
    console.log(
      "\n⚠️  WARNING: This will delete ALL data except admin accounts!"
    );
    console.log("   - All teams will be deleted");
    console.log("   - All evaluators will be deleted");
    console.log("   - All submissions will be deleted");
    console.log("   - All evaluations will be deleted");
    console.log("   - All assignments will be deleted");
    console.log("   - All results will be deleted");
    console.log("   - All chat messages will be deleted");
    console.log("   - Admin accounts will be PRESERVED\n");

    rl.question(
      "Are you sure you want to reset the system? (yes/no): ",
      (answer) => {
        resolve(answer.toLowerCase() === "yes");
      }
    );
  });
};

const main = async () => {
  try {
    await connectDB();

    const confirmed = await confirmReset();

    if (!confirmed) {
      console.log("\n❌ System reset cancelled.\n");
      rl.close();
      process.exit(0);
    }

    await resetSystem();

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Fatal error:", error);
    rl.close();
    process.exit(1);
  }
};

main();
