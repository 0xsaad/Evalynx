import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const FeedbackView = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/team/feedback");
      const feedbackData =
        response.data.data?.feedbacks || response.data.feedbacks || [];
      setFeedbacks(feedbackData);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "suggestion":
        return "💡";
      case "improvement":
        return "🔧";
      case "positive":
        return "👍";
      case "concern":
        return "⚠️";
      default:
        return "📝";
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case "suggestion":
        return "bg-info";
      case "improvement":
        return "bg-warning text-dark";
      case "positive":
        return "bg-success";
      case "concern":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>
                <i className="bi bi-chat-left-text me-2"></i>
                Evaluator Feedback
              </h2>
              <p className="text-muted">
                Review feedback from your assigned evaluators
              </p>
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/team/dashboard")}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
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

      {/* Info Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-info">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-info-circle me-2"></i>
                About Feedback
              </h5>
              <p className="card-text mb-0">
                Evaluators may provide preliminary feedback to help you improve
                your submission before the final evaluation. Use this feedback
                constructively to enhance your video content and address any
                concerns raised.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="row">
        <div className="col-12">
          {feedbacks.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <p className="text-muted mt-3 mb-0">No feedback received yet</p>
                <small className="text-muted">
                  Evaluators will provide feedback after reviewing your
                  submission
                </small>
              </div>
            </div>
          ) : (
            <div className="row">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="col-12 mb-3">
                  <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <div>
                        <strong>
                          <i className="bi bi-person-circle me-2"></i>
                          {feedback.evaluatorId.name}
                        </strong>
                        {feedback.evaluatorId.expertise && (
                          <span className="text-muted ms-2">
                            ({feedback.evaluatorId.expertise})
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className={`badge ${getCategoryBadgeClass(
                            feedback.category
                          )}`}
                        >
                          {getCategoryIcon(feedback.category)}{" "}
                          {feedback.category}
                        </span>
                        <small className="text-muted">
                          {formatDate(feedback.createdAt)}
                        </small>
                      </div>
                    </div>
                    <div className="card-body">
                      <p
                        className="card-text"
                        style={{ whiteSpace: "pre-wrap" }}
                      >
                        {feedback.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {feedbacks.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body">
                <h6 className="card-title">Feedback Summary</h6>
                <div className="row text-center">
                  <div className="col-md-3">
                    <div className="p-2">
                      <h4 className="mb-0">{feedbacks.length}</h4>
                      <small className="text-muted">Total Feedback</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-2">
                      <h4 className="mb-0">
                        {
                          feedbacks.filter((f) => f.category === "positive")
                            .length
                        }
                      </h4>
                      <small className="text-muted">Positive</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-2">
                      <h4 className="mb-0">
                        {
                          feedbacks.filter((f) => f.category === "suggestion")
                            .length
                        }
                      </h4>
                      <small className="text-muted">Suggestions</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-2">
                      <h4 className="mb-0">
                        {
                          feedbacks.filter((f) => f.category === "improvement")
                            .length
                        }
                      </h4>
                      <small className="text-muted">Improvements</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackView;
