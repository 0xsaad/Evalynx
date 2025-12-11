require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const resetAdminPassword = async () => {
  try {
    const args = process.argv.slice(2);

    if (args.length < 2) {
      console.error("Usage: node resetAdminPassword.js <email> <newPassword>");
      console.error(
        "Example: node resetAdminPassword.js admin@evalynx.com NewPassword123"
      );
      process.exit(1);
    }

    const email = args[0];
    const newPassword = args[1];

    if (newPassword.length < 8) {
      console.error("Error: Password must be at least 8 characters long");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Connected");

    const admin = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
    });

    if (!admin) {
      console.error(`Error: Admin account with email "${email}" not found`);
      process.exit(1);
    }

    admin.password = newPassword;
    admin.isFirstLogin = true;
    admin.passwordChangedAt = new Date();

    await admin.save();

    const timestamp = new Date().toISOString();
    console.log("✓ Admin password reset successfully");
    console.log("Email:", admin.email);
    console.log("Name:", admin.name);
    console.log("Reset Timestamp:", timestamp);
    console.log("isFirstLogin: true");
    console.log(
      "\nIMPORTANT: The admin must change the password on next login!"
    );

    process.exit(0);
  } catch (error) {
    console.error("Error resetting admin password:", error.message);
    process.exit(1);
  }
};

resetAdminPassword();
