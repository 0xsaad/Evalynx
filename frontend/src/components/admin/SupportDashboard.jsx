import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";
import "./SupportDashboard.css";

const SupportDashboard = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

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
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL.replace("/api", ""), {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("new_message", (message) => {
      console.log("Admin: Received new message", message);

      if (
        selectedTeam &&
        String(message.teamId) === String(selectedTeam.teamId)
      ) {
        setMessages((prev) => [...prev, message]);
      }

      loadConversations();
    });

    socket.on("user_typing", ({ role, isTyping: typing }) => {
      if (role === "team") {
        setIsTyping(typing);
      }
    });

    socket.on("messages_read", ({ role }) => {
      if (role === "team") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderRole === "admin" ? { ...msg, read: true } : msg
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
  }, [selectedTeam]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedTeam && socketRef.current) {
      socketRef.current.emit("join_chat", { teamId: selectedTeam.teamId });
      loadMessages(selectedTeam.teamId);
      markAsRead(selectedTeam.teamId);
    }
  }, [selectedTeam]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/chat/conversations");
      if (response.data.success) {
        setConversations(response.data.data.conversations);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (teamId) => {
    try {
      const response = await api.get(`/chat/messages?teamId=${teamId}`);
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const markAsRead = async (teamId) => {
    try {
      await api.put(`/chat/mark-read/${teamId}`);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.teamId === teamId ? { ...conv, unreadCount: 0 } : conv
        )
      );

      if (socketRef.current) {
        socketRef.current.emit("mark_read", { teamId });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedTeam) return;

    try {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("send_message", {
          message: newMessage.trim(),
          teamId: selectedTeam.teamId,
        });

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socketRef.current.emit("typing", {
          teamId: selectedTeam.teamId,
          isTyping: false,
        });
      } else {
        const response = await api.post("/chat/send", {
          message: newMessage.trim(),
          teamId: selectedTeam.teamId,
        });

        if (response.data.success) {
          setMessages((prev) => [...prev, response.data.data.message]);
        }
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socketRef.current || !selectedTeam) return;

    socketRef.current.emit("typing", {
      teamId: selectedTeam.teamId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing", {
        teamId: selectedTeam.teamId,
        isTyping: false,
      });
    }, 2000);
  };

  const handleDeleteConversation = async (teamId) => {
    if (
      !confirm(
        "Are you sure you want to delete this entire conversation? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`/chat/conversation/${teamId}`);

      if (response.data.success) {
        setMessages([]);
        setSelectedTeam(null);
        loadConversations();
        alert("Conversation deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("Failed to delete conversation. Please try again.");
    }
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

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.teamEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce(
    (sum, conv) => sum + conv.unreadCount,
    0
  );

  return (
    <div className="container-fluid mt-4">
      <div className="row mb-4">
        <div className="col">
          <h2>
            <i className="bi bi-headset me-2"></i>
            Support Dashboard
          </h2>
          <p className="text-muted">Manage team support conversations</p>
        </div>
        <div className="col-auto">
          <div className="badge bg-primary fs-6">
            {totalUnread} Unread Message{totalUnread !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="row">
        {/* Conversations List */}
        <div className="col-md-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-chat-dots me-2"></i>
                Conversations
              </h5>
            </div>
            <div className="card-body p-0">
              {/* Search */}
              <div className="p-3 border-bottom">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Conversations List */}
              <div className="support-conversations-list">
                {loading ? (
                  <div className="text-center py-4">
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-inbox fs-1 mb-2 d-block"></i>
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.teamId}
                      className={`support-conversation-item ${
                        selectedTeam?.teamId === conv.teamId ? "active" : ""
                      }`}
                      onClick={() => setSelectedTeam(conv)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{conv.teamName}</h6>
                          <small className="text-muted d-block mb-1">
                            {conv.teamEmail}
                          </small>
                          <p className="mb-0 text-truncate small">
                            <span
                              className={
                                conv.lastSenderRole === "admin"
                                  ? "text-primary"
                                  : ""
                              }
                            >
                              {conv.lastSenderRole === "admin" ? "You: " : ""}
                            </span>
                            {conv.lastMessage}
                          </p>
                          <small className="text-muted">
                            {formatTime(conv.lastMessageAt)}
                          </small>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="badge bg-danger rounded-pill">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="col-md-8">
          {selectedTeam ? (
            <div className="card">
              <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{selectedTeam.teamName}</h5>
                    <small className="text-muted">
                      {selectedTeam.teamEmail}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {isConnected ? (
                      <span className="badge bg-success">
                        <i
                          className="bi bi-circle-fill me-1"
                          style={{ fontSize: "8px" }}
                        ></i>
                        Online
                      </span>
                    ) : (
                      <span className="badge bg-secondary">
                        <i
                          className="bi bi-circle-fill me-1"
                          style={{ fontSize: "8px" }}
                        ></i>
                        Offline
                      </span>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        handleDeleteConversation(selectedTeam.teamId)
                      }
                      title="Delete conversation"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body support-messages-container">
                {messages.length === 0 ? (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-chat-text fs-1 mb-2 d-block"></i>
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={msg._id || index}
                      className={`support-message ${
                        msg.senderRole === "admin"
                          ? "support-message-sent"
                          : "support-message-received"
                      }`}
                    >
                      <div className="support-message-content">
                        <div className="support-message-text">
                          {msg.message}
                        </div>
                        <div className="support-message-time">
                          {formatTime(msg.sentAt)}
                          {msg.senderRole === "admin" && (
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
                  <div className="support-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="card-footer">
                <form onSubmit={handleSendMessage} className="d-flex">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={handleTyping}
                    maxLength={1000}
                    disabled={!isConnected}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!newMessage.trim() || !isConnected}
                  >
                    <i className="bi bi-send-fill"></i>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-chat-square-text fs-1 text-muted mb-3 d-block"></i>
                <h5 className="text-muted">
                  Select a conversation to start chatting
                </h5>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportDashboard;
