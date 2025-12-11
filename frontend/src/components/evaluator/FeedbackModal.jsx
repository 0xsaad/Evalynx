import { useState } from "react";
import api from "../../services/api";

const FeedbackModal = ({ show, onClose, teamId, teamName, onFeedbackSent }) => {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("suggestion");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (message.trim().length < 10) {
      setError("Feedback must be at least 10 characters long");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await api.post(`/evaluator/feedback/${teamId}`, {
        message: message.trim(),
        category,
      });

      setMessage("");
      setCategory("suggestion");

      if (onFeedbackSent) {
        onFeedbackSent();
      }

      onClose();
    } catch (err) {
      console.error("Error sending feedback:", err);
      setError(err.response?.data?.error?.message || "Failed to send feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage("");
    setCategory("suggestion");
    setError(null);
    onClose();
  };

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-chat-left-text me-2"></i>
              Send Feedback to {teamName}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={submitting}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div
                  className="alert alert-danger alert-dismissible fade show"
                  role="alert"
                >
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError(null)}
                  ></button>
                </div>
              )}

              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Preliminary Feedback:</strong> Use this to provide
                constructive feedback to help the team improve their submission
                before the final evaluation.
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <strong>Feedback Type</strong>
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                >
                  <option value="suggestion">💡 Suggestion</option>
                  <option value="improvement">🔧 Needs Improvement</option>
                  <option value="positive">👍 Positive Feedback</option>
                  <option value="concern">⚠️ Concern</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  <strong>Feedback Message</strong>
                  <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="6"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide detailed feedback to help the team improve their submission..."
                  disabled={submitting}
                  required
                  minLength={10}
                  maxLength={2000}
                ></textarea>
                <div className="form-text">
                  {message.length}/2000 characters (minimum 10 characters)
                </div>
              </div>

              <div className="card bg-light">
                <div className="card-body">
                  <h6 className="card-title">
                    <i className="bi bi-lightbulb me-2"></i>
                    Feedback Guidelines
                  </h6>
                  <ul className="mb-0 small">
                    <li>Be specific and constructive</li>
                    <li>Focus on actionable improvements</li>
                    <li>Highlight both strengths and areas for improvement</li>
                    <li>
                      Reference specific evaluation criteria when relevant
                    </li>
                    <li>Maintain a professional and encouraging tone</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || message.trim().length < 10}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Send Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
