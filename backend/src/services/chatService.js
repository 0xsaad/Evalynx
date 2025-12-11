const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");

const sendMessage = async (senderId, senderRole, teamId, message) => {
  if (senderRole === "team" && senderId.toString() !== teamId.toString()) {
    throw new Error("Teams can only send messages to their own chat");
  }

  const chatMessage = await ChatMessage.create({
    teamId,
    senderId,
    senderRole,
    message,
    sentAt: new Date(),
  });

  await chatMessage.populate("senderId", "name email role");

  return chatMessage;
};

const getConversationHistory = async (teamId, limit = 20, offset = 0) => {
  const messages = await ChatMessage.find({ teamId })
    .sort({ sentAt: -1 })
    .skip(offset)
    .limit(limit)
    .populate("senderId", "name email role")
    .lean();

  return messages.reverse();
};

const getUnreadCount = async (teamId, role) => {
  const senderRole = role === "team" ? "admin" : "team";

  const count = await ChatMessage.countDocuments({
    teamId,
    senderRole,
    read: false,
  });

  return count;
};

const markMessagesAsRead = async (teamId, role) => {
  const senderRole = role === "team" ? "admin" : "team";

  const result = await ChatMessage.updateMany(
    {
      teamId,
      senderRole,
      read: false,
    },
    {
      $set: { read: true },
    }
  );

  return result.modifiedCount;
};

const getAllConversations = async () => {
  const conversations = await ChatMessage.aggregate([
    {
      $sort: { sentAt: -1 },
    },
    {
      $group: {
        _id: "$teamId",
        lastMessage: { $first: "$message" },
        lastMessageAt: { $first: "$sentAt" },
        lastSenderRole: { $first: "$senderRole" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$read", false] },
                  { $eq: ["$senderRole", "team"] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $sort: { lastMessageAt: -1 },
    },
  ]);

  const conversationsWithTeamInfo = await Promise.all(
    conversations.map(async (conv) => {
      const team = await User.findById(conv._id).select("name email").lean();
      return {
        teamId: conv._id,
        teamName: team?.name || "Unknown Team",
        teamEmail: team?.email || "",
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        lastSenderRole: conv.lastSenderRole,
        unreadCount: conv.unreadCount,
      };
    })
  );

  return conversationsWithTeamInfo;
};

const deleteConversation = async (teamId) => {
  const result = await ChatMessage.deleteMany({ teamId });
  return result.deletedCount;
};

module.exports = {
  sendMessage,
  getConversationHistory,
  getUnreadCount,
  markMessagesAsRead,
  getAllConversations,
  deleteConversation,
};
