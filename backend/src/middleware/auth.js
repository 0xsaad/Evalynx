const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          message: "No token provided. Please authenticate.",
          code: "NO_TOKEN",
        },
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: "User no longer exists",
          code: "USER_NOT_FOUND",
        },
      });
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Password was recently changed. Please log in again.",
          code: "PASSWORD_CHANGED",
        },
      });
    }

    req.user = user;
    req.tokenPayload = decoded;

    next();
  } catch (error) {
    if (error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: "Authentication failed",
        code: "AUTH_ERROR",
      },
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: "Authentication required",
          code: "NOT_AUTHENTICATED",
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: "You do not have permission to access this resource",
          code: "INSUFFICIENT_PERMISSIONS",
        },
      });
    }

    if (req.user.role === "evaluator" && !req.user.approved) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Your evaluator account is pending approval",
          code: "PENDING_APPROVAL",
        },
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole,
};
