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

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === "yes" || answer.toLowerCase() === "y");
    });
  });
};

const selectiveReset = async () => {
  try {
    console.log("\n🔄 Selective System Reset\n");
    console.log("Choose what to reset:\n");

    const resetEvaluations = await askQuestion("Reset evaluations? (yes/no): ");
    const resetAssignments = await askQuestion("Reset assignments? (yes/no): ");
    const resetResults = await askQuestion("Reset results? (yes/no): ");
    const resetSubmissions = await askQuestion("Reset submissions? (yes/no): ");
    const resetChatMessages = await askQuestion(
      "Reset chat messages? (yes/no): "
    );
    const resetEvaluators = await askQuestion(
      "Reset evaluators (delete all)? (yes/no): "
    );
    const resetTeams = await askQuestion(
      "Reset teams (delete all)? (yes/no): "
    );

    console.log("\n📋 Summary of actions:");
    if (resetEvaluations) console.log("   ✓ Will delete all evaluations");
    if (resetAssignments) console.log("   ✓ Will delete all assignments");
    if (resetResults) console.log("   ✓ Will delete all results");
    if (resetSubmissions) console.log("   ✓ Will delete all submissions");
    if (resetChatMessages) console.log("   ✓ Will delete all chat messages");
    if (resetEvaluators) console.log("   ✓ Will delete all evaluators");
    if (resetTeams) console.log("   ✓ Will delete all teams");

    const confirm = await askQuestion(
      "\nProceed with these actions? (yes/no): "
    );

    if (!confirm) {
      console.log("\n❌ Reset cancelled.\n");
      return;
    }

    console.log("\n🔄 Processing...\n");

    let totalDeleted = 0;

    if (resetEvaluations) {
      const result = await Evaluation.deleteMany({});
      console.log(`✓ Deleted ${result.deletedCount} evaluations`);
      totalDeleted += result.deletedCount;

      await Submission.updateMany(
        {},
        {
          $set: { evaluationCount: 0, averageScore: null },
        }
      );
      console.log("✓ Reset evaluation counts in submissions");
    }

    if (resetAssignments) {
      const result = await Assignment.deleteMany({});
      console.log(`✓ Deleted ${result.deletedCount} assignments`);
      totalDeleted += result.deletedCount;
    }

    if (resetResults) {
      const result = await Result.deleteMany({});
      console.log(`✓ Deleted ${result.deletedCount} results`);
      totalDeleted += result.deletedCount;
    }

    if (resetSubmissions) {
      const result = await Submission.deleteMany({});
      console.log(`✓ Deleted ${result.deletedCount} submissions`);
      totalDeleted += result.deletedCount;
    }

    if (resetChatMessages) {
      const result = await ChatMessage.deleteMany({});
      console.log(`✓ Deleted ${result.deletedCount} chat messages`);
      totalDeleted += result.deletedCount;
    }

    if (resetEvaluators) {
      const result = await User.deleteMany({ role: "evaluator" });
      console.log(`✓ Deleted ${result.deletedCount} evaluators`);
      totalDeleted += result.deletedCount;
    }

    if (resetTeams) {
      const result = await User.deleteMany({ role: "team" });
      console.log(`✓ Deleted ${result.deletedCount} teams`);
      totalDeleted += result.deletedCount;
    }

    console.log(
      `\n✅ Selective reset completed! Total items deleted: ${totalDeleted}\n`
    );
  } catch (error) {
    console.error("\n✗ Error during selective reset:", error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await selectiveReset();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Fatal error:", error);
    rl.close();
    process.exit(1);
  }
};

main();
