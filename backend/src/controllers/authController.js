const User = require("../models/User");
const { generateToken } = require("../utils/jwt");

const register = async (req, res) => {
  try {
    const { role, name, email, password, teamMembers, expertise } = req.body;

    if (!role || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Please provide all required fields: role, name, email, password",
          code: "MISSING_FIELDS",
        },
      });
    }

    if (role !== "team" && role !== "evaluator") {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Invalid role. Only team and evaluator registration is allowed.",
          code: "INVALID_ROLE",
        },
      });
    }

    if (role === "team") {
      if (
        !teamMembers ||
        !Array.isArray(teamMembers) ||
        teamMembers.length < 1 ||
        teamMembers.length > 5
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Team must have between 1 and 5 members",
            code: "INVALID_TEAM_MEMBERS",
          },
        });
      }
    }

    if (role === "evaluator" && !expertise) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Expertise is required for evaluator registration",
          code: "MISSING_EXPERTISE",
        },
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: "Email is already registered",
          code: "EMAIL_EXISTS",
        },
      });
    }

    const userData = {
      name,
      email,
      password,
      role,
    };

    if (role === "team") {
      userData.teamMembers = teamMembers;
      userData.approved = true;
    } else if (role === "evaluator") {
      userData.expertise = expertise;
      userData.approved = false;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message:
        role === "team"
          ? "Team registered successfully. You can now log in."
          : "Evaluator registration submitted. Please wait for admin approval.",
      userId: user._id,
      role: user.role,
      approved: user.approved,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: {
          message: messages.join(", "),
          code: "VALIDATION_ERROR",
          details: error.errors,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: "Registration failed. Please try again.",
        code: "REGISTRATION_ERROR",
      },
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Please provide email, password, and role",
          code: "MISSING_CREDENTIALS",
        },
      });
    }

    if (!["team", "evaluator", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Invalid role specified",
          code: "INVALID_ROLE",
        },
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      role: role,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        },
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Invalid credentials",
          code: "INVALID_CREDENTIALS",
        },
      });
    }

    if (user.role === "evaluator" && !user.approved) {
      return res.status(403).json({
        success: false,
        error: {
          message:
            "Your account is pending admin approval. Please wait for approval before logging in.",
          code: "PENDING_APPROVAL",
        },
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Login failed. Please try again.",
        code: "LOGIN_ERROR",
      },
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Please provide both current password and new password",
          code: "MISSING_FIELDS",
        },
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          message: "New password must be at least 8 characters long",
          code: "INVALID_PASSWORD",
        },
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
          code: "WEAK_PASSWORD",
        },
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: "User not found",
          code: "USER_NOT_FOUND",
        },
      });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Current password is incorrect",
          code: "INVALID_CURRENT_PASSWORD",
        },
      });
    }

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: "New password cannot be the same as current password",
          code: "SAME_PASSWORD",
        },
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    user.isFirstLogin = false;

    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      token,
      passwordChangedAt: user.passwordChangedAt,
    });
  } catch (error) {
    console.error("Password change error:", error);

    res.status(500).json({
      success: false,
      error: {
        message: "Password change failed. Please try again.",
        code: "PASSWORD_CHANGE_ERROR",
      },
    });
  }
};

module.exports = {
  register,
  login,
  changePassword,
};
