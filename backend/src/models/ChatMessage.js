const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Team ID is required"],
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
    },
    senderRole: {
      type: String,
      enum: ["team", "admin"],
      required: [true, "Sender role is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    read: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
chatMessageSchema.index({ teamId: 1 });
chatMessageSchema.index({ sentAt: -1 }); // For sorting by most recent
chatMessageSchema.index({ teamId: 1, read: 1 }); // For unread message queries
chatMessageSchema.index({ teamId: 1, sentAt: -1 }); // For conversation history

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = ChatMessage;
