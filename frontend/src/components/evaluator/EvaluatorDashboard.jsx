import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import FeedbackModal from "./FeedbackModal";

const EvaluatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState("all"); // all, pending, completed
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/evaluator/assignments");
      const assignmentsData =
        response.data.data?.assignments || response.data.assignments || [];
      setAssignments(assignmentsData);
      console.log("Assignments loaded:", assignmentsData);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = (teamId) => {
    navigate(`/evaluator/evaluate/${teamId}`);
  };

  const sendFeedback = (assignment) => {
    setSelectedTeam(assignment);
    setShowFeedbackModal(true);
  };

  const feedbackSent = () => {
    setSuccess("Feedback sent successfully!");
    setTimeout(() => setSuccess(null), 3000);
  };

  const totalAssigned = assignments.length;
  const completedCount = assignments.filter((a) => a.evaluated).length;
  const pendingCount = totalAssigned - completedCount;

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "completed") return assignment.evaluated;
    if (filter === "pending") return !assignment.evaluated;
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* Welcome Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>Welcome, {user?.name}!</h2>
          <p className="text-muted">Evaluate assigned team submissions</p>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess(null)}
          ></button>
        </div>
      )}

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

      {/* Statistics Summary */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card text-center h-100 border-primary">
            <div className="card-body">
              <i className="bi bi-clipboard-check fs-1 text-primary"></i>
              <h5 className="card-title mt-3">Total Assigned</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-primary">
                  {totalAssigned}
                </span>
              </p>
              <small className="text-muted">Teams to evaluate</small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card text-center h-100 border-success">
            <div className="card-body">
              <i className="bi bi-check-circle-fill fs-1 text-success"></i>
              <h5 className="card-title mt-3">Completed</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-success">
                  {completedCount}
                </span>
              </p>
              <small className="text-muted">Evaluations submitted</small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card text-center h-100 border-warning">
            <div className="card-body">
              <i className="bi bi-hourglass-split fs-1 text-warning"></i>
              <h5 className="card-title mt-3">Pending</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-warning">
                  {pendingCount}
                </span>
              </p>
              <small className="text-muted">Awaiting evaluation</small>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Teams Section */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Assigned Teams</h5>

              {/* Filter Buttons */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className={`btn ${
                    filter === "all" ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => setFilter("all")}
                >
                  All ({totalAssigned})
                </button>
                <button
                  type="button"
                  className={`btn ${
                    filter === "pending" ? "btn-warning" : "btn-outline-warning"
                  }`}
                  onClick={() => setFilter("pending")}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  className={`btn ${
                    filter === "completed"
                      ? "btn-success"
                      : "btn-outline-success"
                  }`}
                  onClick={() => setFilter("completed")}
                >
                  Completed ({completedCount})
                </button>
              </div>
            </div>
            <div className="card-body">
              {filteredAssignments.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="text-muted mt-3">
                    {filter === "all"
                      ? "No teams assigned yet. Please wait for admin to assign teams."
                      : `No ${filter} evaluations.`}
                  </p>
                </div>
              ) : (
                <div className="row">
                  {filteredAssignments.map((assignment) => (
                    <div
                      key={assignment.teamId}
                      className="col-md-6 col-lg-4 mb-3"
                    >
                      <div
                        className={`card h-100 ${
                          assignment.evaluated
                            ? "border-success"
                            : "border-warning"
                        }`}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="card-title mb-0">
                              {assignment.teamName}
                            </h6>
                            {assignment.evaluated ? (
                              <span className="badge bg-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Completed
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark">
                                <i className="bi bi-hourglass-split me-1"></i>
                                Pending
                              </span>
                            )}
                          </div>

                          {assignment.videoUrl ? (
                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">
                                Submission:
                              </small>
                              <a
                                href={assignment.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-secondary w-100"
                              >
                                <i className="bi bi-play-circle me-1"></i>
                                View Video
                              </a>
                            </div>
                          ) : (
                            <div className="mb-3">
                              <small className="text-muted">
                                No submission yet
                              </small>
                            </div>
                          )}

                          <div className="d-grid gap-2">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => sendFeedback(assignment)}
                              disabled={!assignment.videoUrl}
                            >
                              <i className="bi bi-chat-left-text me-1"></i>
                              Send Feedback
                            </button>
                            <button
                              className={`btn btn-sm ${
                                assignment.evaluated
                                  ? "btn-outline-primary"
                                  : "btn-primary"
                              }`}
                              onClick={() => handleEvaluate(assignment.teamId)}
                              disabled={!assignment.videoUrl}
                            >
                              <i
                                className={`bi ${
                                  assignment.evaluated
                                    ? "bi-eye"
                                    : "bi-pencil-square"
                                } me-1`}
                              ></i>
                              {assignment.evaluated
                                ? "View Evaluation"
                                : "Evaluate Now"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FeedbackModal
        show={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        teamId={selectedTeam?.teamId}
        teamName={selectedTeam?.teamName}
        onFeedbackSent={feedbackSent}
      />
    </div>
  );
};

export default EvaluatorDashboard;
