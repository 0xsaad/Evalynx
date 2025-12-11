import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import FeedbackModal from "./FeedbackModal";

const AssignedTeams = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
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

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "completed") return assignment.evaluated;
    if (filter === "pending") return !assignment.evaluated;
    return true;
  });

  const totalCount = assignments.length;
  const completedCount = assignments.filter((a) => a.evaluated).length;
  const pendingCount = totalCount - completedCount;

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading assigned teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>Assigned Teams</h2>
          <p className="text-muted">
            View and evaluate your assigned team submissions
          </p>
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

      {/* Controls */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                {/* Filter Buttons */}
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn ${
                      filter === "all" ? "btn-primary" : "btn-outline-primary"
                    }`}
                    onClick={() => setFilter("all")}
                  >
                    <i className="bi bi-list-ul me-1"></i>
                    All ({totalCount})
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      filter === "pending"
                        ? "btn-warning"
                        : "btn-outline-warning"
                    }`}
                    onClick={() => setFilter("pending")}
                  >
                    <i className="bi bi-hourglass-split me-1"></i>
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
                    <i className="bi bi-check-circle me-1"></i>
                    Completed ({completedCount})
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="btn-group" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      viewMode === "grid"
                        ? "btn-secondary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setViewMode("grid")}
                    title="Grid View"
                  >
                    <i className="bi bi-grid-3x3-gap"></i>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      viewMode === "list"
                        ? "btn-secondary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setViewMode("list")}
                    title="List View"
                  >
                    <i className="bi bi-list"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Display */}
      <div className="row">
        <div className="col-12">
          {filteredAssignments.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <p className="text-muted mt-3">
                  {filter === "all"
                    ? "No teams assigned yet. Please wait for admin to assign teams."
                    : `No ${filter} evaluations.`}
                </p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="row">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.teamId} className="col-md-6 col-lg-4 mb-4">
                  <div
                    className={`card h-100 ${
                      assignment.evaluated ? "border-success" : "border-warning"
                    }`}
                  >
                    <div className="card-header d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">{assignment.teamName}</h6>
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
                    <div className="card-body">
                      <div className="mb-3">
                        <small className="text-muted d-block mb-2">
                          <i className="bi bi-info-circle me-1"></i>
                          Team ID: {assignment.teamId}
                        </small>

                        {assignment.videoUrl ? (
                          <div>
                            <small className="text-muted d-block mb-1">
                              Submission:
                            </small>
                            <a
                              href={assignment.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-secondary w-100 mb-2"
                            >
                              <i className="bi bi-play-circle me-1"></i>
                              View Video Submission
                            </a>
                          </div>
                        ) : (
                          <div className="alert alert-warning py-2 mb-2">
                            <small>
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              No submission yet
                            </small>
                          </div>
                        )}
                      </div>

                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => sendFeedbaceedback(assi)}
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
          ) : (
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Status</th>
                      <th>Submission</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.teamId}>
                        <td>
                          <strong>{assignment.teamName}</strong>
                          <br />
                          <small className="text-muted">
                            ID: {assignment.teamId}
                          </small>
                        </td>
                        <td>
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
                        </td>
                        <td>
                          {assignment.videoUrl ? (
                            <a
                              href={assignment.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-secondary"
                            >
                              <i className="bi bi-play-circle me-1"></i>
                              View Video
                            </a>
                          ) : (
                            <span className="text-muted">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              No submission
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="btn-group" role="group">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => sendFeedback(assignment)}
                              disabled={!assignment.videoUrl}
                              title="Send Feedback"
                            >
                              <i className="bi bi-chat-left-text"></i>
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
                              {assignment.evaluated ? "View" : "Evaluate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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

export default AssignedTeams;
