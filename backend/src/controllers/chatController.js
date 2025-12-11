const chatService = require("../services/chatService");

const getMessages = async (req, res) => {
  try {
    const { teamId } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    let targetTeamId;

    if (req.user.role === "team") {
      targetTeamId = req.user._id;
    } else if (req.user.role === "admin") {
      if (!teamId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Team ID is required for admin",
            code: "MISSING_TEAM_ID",
          },
        });
      }
      targetTeamId = teamId;
    } else {
      return res.status(403).json({
        success: false,
        error: {
          message: "Unauthorized access",
          code: "UNAUTHORIZED",
        },
      });
    }

    const messages = await chatService.getConversationHistory(
      targetTeamId,
      limit,
      offset
    );

    return res.status(200).json({
      success: true,
      data: {
        messages,
        count: messages.length,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error in getMessages:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch messages",
        code: "FETCH_ERROR",
      },
    });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { message, teamId } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Message is required",
          code: "MISSING_MESSAGE",
        },
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Message too long (max 1000 characters)",
          code: "MESSAGE_TOO_LONG",
        },
      });
    }

    let targetTeamId;

    if (req.user.role === "team") {
      targetTeamId = req.user._id;
    } else if (req.user.role === "admin") {
      if (!teamId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Team ID is required for admin",
            code: "MISSING_TEAM_ID",
          },
        });
      }
      targetTeamId = teamId;
    } else {
      return res.status(403).json({
        success: false,
        error: {
          message: "Unauthorized access",
          code: "UNAUTHORIZED",
        },
      });
    }

    const chatMessage = await chatService.sendMessage(
      req.user._id,
      req.user.role,
      targetTeamId,
      message.trim()
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        message: {
          _id: chatMessage._id,
          message: chatMessage.message,
          senderId: chatMessage.senderId._id,
          senderName: chatMessage.senderId.name,
          senderRole: chatMessage.senderRole,
          sentAt: chatMessage.sentAt,
          read: chatMessage.read,
        },
      },
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: {
          message: error.message,
          code: "VALIDATION_ERROR",
          details: error.errors,
        },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: error.message || "Failed to send message",
        code: "SEND_ERROR",
      },
    });
  }
};

const getConversations = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          message: "Unauthorized: Admin access required",
          code: "UNAUTHORIZED",
        },
      });
    }

    const conversations = await chatService.getAllConversations();

    return res.status(200).json({
      success: true,
      data: {
        conversations,
        count: conversations.length,
      },
    });
  } catch (error) {
    console.error("Error in getConversations:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to fetch conversations",
        code: "FETCH_ERROR",
      },
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (req.user.role === "team" && req.user._id.toString() !== teamId) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Unauthorized: Teams can only mark their own messages",
          code: "UNAUTHORIZED",
        },
      });
    }

    const count = await chatService.markMessagesAsRead(teamId, req.user.role);

    return res.status(200).json({
      success: true,
      message: "Messages marked as read",
      data: {
        count,
      },
    });
  } catch (error) {
    console.error("Error in markAsRead:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to mark messages as read",
        code: "UPDATE_ERROR",
      },
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { teamId } = req.query;

    let targetTeamId;

    if (req.user.role === "team") {
      targetTeamId = req.user._id;
    } else if (req.user.role === "admin") {
      if (!teamId) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Team ID is required for admin",
            code: "MISSING_TEAM_ID",
          },
        });
      }
      targetTeamId = teamId;
    } else {
      return res.status(403).json({
        success: false,
        error: {
          message: "Unauthorized access",
          code: "UNAUTHORIZED",
        },
      });
    }

    const count = await chatService.getUnreadCount(targetTeamId, req.user.role);

    return res.status(200).json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to get unread count",
        code: "FETCH_ERROR",
      },
    });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const { teamId } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          message: "Unauthorized: Admin access required",
          code: "UNAUTHORIZED",
        },
      });
    }

    const count = await chatService.deleteConversation(teamId);

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
      data: {
        deletedCount: count,
      },
    });
  } catch (error) {
    console.error("Error in deleteConversation:", error);

    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to delete conversation",
        code: "DELETE_ERROR",
      },
    });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getConversations,
  markAsRead,
  getUnreadCount,
  deleteConversation,
};
