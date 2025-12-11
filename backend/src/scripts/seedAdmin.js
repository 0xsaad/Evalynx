require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Connected");

    const existingAdmin = await User.findOne({
      email: "admin@evalynx.com",
      role: "admin",
    });

    if (existingAdmin) {
      console.log("Admin account already exists");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      process.exit(0);
    }

    const admin = new User({
      name: "System Administrator",
      email: "admin@evalynx.com",
      password: "Admin@123456",
      role: "admin",
      approved: true,
      isFirstLogin: true,
    });

    await admin.save();

    console.log("✓ Admin account created successfully");
    console.log("Email: admin@evalynx.com");
    console.log("Password: Admin@123456");
    console.log("Role: admin");
    console.log("Approved: true");
    console.log("isFirstLogin: true");
    console.log("\nIMPORTANT: Change the password on first login!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
