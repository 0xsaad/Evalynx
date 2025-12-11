const express = require("express");
const router = express.Router();
const {
  register,
  login,
  changePassword,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");

router.post(
  "/register",
  process.env.NODE_ENV === "production"
    ? authLimiter
    : (req, res, next) => next(),
  register
);

router.post(
  "/login",
  process.env.NODE_ENV === "production"
    ? authLimiter
    : (req, res, next) => next(),
  login
);

router.post("/change-password", authenticate, changePassword);

router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await require("../models/User")
      .findById(req.user._id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: "User not found",
          code: "USER_NOT_FOUND",
        },
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        approved: user.approved,
        teamMembers: user.teamMembers,
        expertise: user.expertise,
        isFirstLogin: user.isFirstLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch profile",
        code: "PROFILE_ERROR",
      },
    });
  }
});

module.exports = router;
