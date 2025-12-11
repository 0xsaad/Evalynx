const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const {
  getMessages,
  sendMessage,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteConversation,
} = require("../controllers/chatController");

router.use(authenticate);

router.get("/messages", getMessages);

router.post("/send", sendMessage);

router.get("/conversations", requireRole("admin"), getConversations);

router.put("/mark-read/:teamId", markAsRead);

router.get("/unread-count", getUnreadCount);

router.delete(
  "/conversation/:teamId",
  requireRole("admin"),
  deleteConversation
);

module.exports = router;
