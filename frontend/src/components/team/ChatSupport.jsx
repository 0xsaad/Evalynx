import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";
import "./ChatSupport.css";

const ChatSupport = ({ teamId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !teamId) {
      console.log("Chat: Missing token or teamId", { token: !!token, teamId });
      return;
    }

    const socketUrl = import.meta.env.VITE_API_URL.replace("/api", "");
    console.log("Chat: Connecting to Socket.io server:", socketUrl);

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Chat: Socket connected successfully");
      setIsConnected(true);
      socket.emit("join_chat", { teamId });
    });

    socket.on("connect_error", (error) => {
      console.error("Chat: Socket connection error:", error);
      setIsConnected(false);
    });

    socket.on("disconnect", () => {
      console.log("Chat: Socket disconnected");
      setIsConnected(false);
    });

    socket.on("joined_chat", ({ roomName }) => {
      console.log(`Chat: Joined chat room: ${roomName}`);
    });

    socket.on("new_message", (message) => {
      console.log("Team: Received new message", message);

      setMessages((prev) => {
        if (message.senderRole === "team") {
          const tempIndex = prev.findIndex(
            (msg) =>
              msg._id.toString().startsWith("temp_") &&
              msg.message === message.message
          );

          if (tempIndex !== -1) {
            console.log("Team: Replacing optimistic message with real one");
            const newMessages = [...prev];
            newMessages[tempIndex] = message;
            return newMessages;
          }
        }

        const exists = prev.some((msg) => msg._id === message._id);
        if (exists) {
          console.log("Team: Message already exists, skipping");
          return prev;
        }

        return [...prev, message];
      });

      if (message.senderRole === "admin" && !isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    socket.on("user_typing", ({ role, isTyping: typing }) => {
      if (role === "admin") {
        setIsTyping(typing);
      }
    });

    socket.on("messages_read", ({ role }) => {
      if (role === "admin") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderRole === "team" ? { ...msg, read: true } : msg
          )
        );
      }
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [teamId]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadMessages();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAsRead();
    }
  }, [isOpen]);

  useEffect(() => {
    if (teamId) {
      fetchUnreadCount();
    }
  }, [teamId]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/chat/messages");
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/chat/unread-count");
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const markAsRead = async () => {
    try {
      await api.put(`/chat/mark-read/${teamId}`);
      setUnreadCount(0);

      if (socketRef.current) {
        socketRef.current.emit("mark_read", { teamId });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      if (socketRef.current && isConnected) {
        const optimisticMessage = {
          _id: `temp_${Date.now()}`,
          message: messageText,
          senderRole: "team",
          sentAt: new Date().toISOString(),
          read: false,
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        socketRef.current.emit("send_message", {
          message: messageText,
          teamId,
        });

        // Stop typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socketRef.current.emit("typing", { teamId, isTyping: false });
      } else {
        const response = await api.post("/chat/send", {
          message: messageText,
        });

        if (response.data.success) {
          setMessages((prev) => [...prev, response.data.data.message]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
      // Restore message to input on error
      setNewMessage(messageText);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socketRef.current || !isConnected) return;

    socketRef.current.emit("typing", { teamId, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("typing", { teamId, isTyping: false });
      }
    }, 2000);
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return messageDate.toLocaleDateString();
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chat-float-button ${isOpen ? "d-none" : ""}`}
        onClick={() => setIsOpen(true)}
        title="Chat Support"
      >
        <i className="bi bi-chat-dots-fill"></i>
        {unreadCount > 0 && (
          <span className="chat-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="d-flex align-items-center">
              <i className="bi bi-headset me-2"></i>
              <div>
                <h6 className="mb-0">Technical Support</h6>
                <small className="text-white-50">
                  {isConnected ? (
                    <>
                      <i
                        className="bi bi-circle-fill text-success me-1"
                        style={{ fontSize: "8px" }}
                      ></i>
                      Online
                    </>
                  ) : (
                    <>
                      <i
                        className="bi bi-circle-fill text-danger me-1"
                        style={{ fontSize: "8px" }}
                      ></i>
                      Offline
                    </>
                  )}
                </small>
              </div>
            </div>
            <button
              className="btn btn-sm btn-link text-white"
              onClick={() => setIsOpen(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {isLoading ? (
              <div className="text-center py-4">
                <div
                  className="spinner-border spinner-border-sm text-primary"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="bi bi-chat-text fs-1 mb-2 d-block"></i>
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg._id || index}
                  className={`chat-message ${
                    msg.senderRole === "team"
                      ? "chat-message-sent"
                      : "chat-message-received"
                  }`}
                >
                  <div className="chat-message-content">
                    <div className="chat-message-text">{msg.message}</div>
                    <div className="chat-message-time">
                      {formatTime(msg.sentAt)}
                      {msg.senderRole === "team" && (
                        <i
                          className={`bi bi-check-all ms-1 ${
                            msg.read ? "text-primary" : ""
                          }`}
                        ></i>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="chat-typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="form-control"
              placeholder="Type your message..."
              value={newMessage}
              onChange={handleTyping}
              maxLength={1000}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!newMessage.trim()}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatSupport;
