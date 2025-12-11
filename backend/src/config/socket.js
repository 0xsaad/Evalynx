const jwt = require("jsonwebtoken");
const chatService = require("../services/chatService");

const setupSocketHandlers = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `✓ Socket connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`
    );

    socket.on("join_chat", async ({ teamId }) => {
      try {
        if (socket.userRole === "team" && socket.userId !== teamId) {
          socket.emit("error", {
            message: "Unauthorized: Teams can only join their own chat",
          });
          return;
        }

        if (socket.userRole !== "team" && socket.userRole !== "admin") {
          socket.emit("error", {
            message: "Unauthorized: Only teams and admins can access chat",
          });
          return;
        }

        const roomName = `chat_${teamId}`;
        socket.join(roomName);
        socket.currentTeamId = teamId;

        console.log(
          `✓ User ${socket.userId} (${socket.userRole}) joined room: ${roomName}`
        );

        socket.emit("joined_chat", { teamId, roomName });
      } catch (error) {
        console.error("Error joining chat:", error);
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    socket.on("send_message", async ({ message, teamId }) => {
      try {
        if (socket.userRole === "team" && socket.userId !== teamId) {
          socket.emit("error", {
            message: "Unauthorized: Teams can only send to their own chat",
          });
          return;
        }

        if (!message || message.trim().length === 0) {
          socket.emit("error", { message: "Message cannot be empty" });
          return;
        }

        if (message.length > 1000) {
          socket.emit("error", {
            message: "Message too long (max 1000 characters)",
          });
          return;
        }

        const chatMessage = await chatService.sendMessage(
          socket.userId,
          socket.userRole,
          teamId,
          message.trim()
        );

        const roomName = `chat_${teamId}`;
        io.to(roomName).emit("new_message", {
          _id: chatMessage._id,
          teamId: teamId,
          message: chatMessage.message,
          senderId: chatMessage.senderId._id,
          senderName: chatMessage.senderId.name,
          senderRole: chatMessage.senderRole,
          sentAt: chatMessage.sentAt,
          read: chatMessage.read,
        });

        console.log(`✓ Message sent in room ${roomName} by ${socket.userRole}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", {
          message: error.message || "Failed to send message",
        });
      }
    });

    socket.on("typing", ({ teamId, isTyping }) => {
      try {
        if (socket.userRole === "team" && socket.userId !== teamId) {
          return;
        }

        const roomName = `chat_${teamId}`;
        socket.to(roomName).emit("user_typing", {
          role: socket.userRole,
          isTyping,
        });
      } catch (error) {
        console.error("Error handling typing event:", error);
      }
    });

    socket.on("mark_read", async ({ teamId }) => {
      try {
        if (socket.userRole === "team" && socket.userId !== teamId) {
          socket.emit("error", { message: "Unauthorized" });
          return;
        }

        const count = await chatService.markMessagesAsRead(
          teamId,
          socket.userRole
        );

        const roomName = `chat_${teamId}`;
        io.to(roomName).emit("messages_read", {
          teamId,
          role: socket.userRole,
          count,
        });

        console.log(`✓ ${count} messages marked as read in room ${roomName}`);
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`✗ Socket disconnected: ${socket.id}`);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  console.log("✓ Socket.io handlers configured");
};

module.exports = { setupSocketHandlers };
