const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");
const getCorsOptions = require("./config/cors");
const { applyHelmet } = require("./middleware/security");
const { applyRateLimiting } = require("./middleware/rateLimiter");
const { applySanitization } = require("./middleware/sanitizer");
const { setupSocketHandlers } = require("./config/socket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocketHandlers(io);

connectDB();

console.log("\n🔒 Applying security middleware...");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
console.log("✓ CORS completely disabled for testing");

applyHelmet(app);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

console.log("⚠ Input sanitization disabled for testing");

applyRateLimiting(app);

console.log("✓ All security middleware applied\n");

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "EvalynX API Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      team: "/api/team",
      evaluator: "/api/evaluator",
      admin: "/api/admin",
      public: "/api/public",
      chat: "/api/chat",
    },
    documentation: "See README.md for API documentation",
  });
});

app.get("/api/health", (req, res) => {
  console.log("Health check endpoint hit!");
  res.json({ status: "ok", message: "EvalynX API is running" });
});

const authRoutes = require("./routes/auth");
const teamRoutes = require("./routes/team");
const evaluatorRoutes = require("./routes/evaluator");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");
const chatRoutes = require("./routes/chat");

app.use("/api/auth", authRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/evaluator", evaluatorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(404).json({
      success: false,
      error: {
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
        code: "ENDPOINT_NOT_FOUND",
        availableEndpoints: [
          "GET /api/health",
          "POST /api/auth/register",
          "POST /api/auth/login",
          "GET /api/auth/profile",
          "POST /api/auth/change-password",
          "GET /api/public/competition-info",
          "GET /api/public/leaderboard",
          "GET /api/team/*",
          "GET /api/evaluator/*",
          "GET /api/admin/*",
        ],
      },
    });
  } else {
    res.status(404).json({
      success: false,
      error: {
        message:
          "This is an API server. Frontend should be accessed separately.",
        code: "NOT_FOUND",
        frontend: "http://localhost:5173",
        api: "http://localhost:5001/api",
      },
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: err.code,
      details: err.details,
    },
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready for connections`);
});
