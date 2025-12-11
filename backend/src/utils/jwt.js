const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  const payload = {
    userId: user._id || user.id,
    role: user.role,
    approved: user.approved,
    isFirstLogin: user.isFirstLogin || false,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const err = new Error("Token has expired");
      err.statusCode = 401;
      err.code = "TOKEN_EXPIRED";
      throw err;
    } else if (error.name === "JsonWebTokenError") {
      const err = new Error("Invalid token");
      err.statusCode = 401;
      err.code = "INVALID_TOKEN";
      throw err;
    }
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
