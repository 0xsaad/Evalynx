import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../../services/api";
import SubmissionForm from "./SubmissionForm";
import ScoreView from "./ScoreView";
import ChatSupport from "./ChatSupport";

const TeamDashboard = () => {
  const { user } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [unreadFeedbackCount, setUnreadFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      try {
        const submissionResponse = await api.get("/team/submission");
        const submissionData =
          submissionResponse.data.data?.submission ||
          submissionResponse.data.submission;
        setSubmission(submissionData);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Error fetching submission:", err);
        }
      }

      try {
        const feedbackCountResponse = await api.get(
          "/team/feedback/unread-count"
        );
        setUnreadFeedbackCount(
          feedbackCountResponse.data.data?.unreadCount || 0
        );
      } catch (err) {
        console.log("Error fetching feedback count:", err);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionUpdate = (updatedSubmission) => {
    setSubmission(updatedSubmission);
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="row mb-4">
        <div className="col">
          <h2>Welcome, {user?.name}!</h2>
          <p className="text-muted">
            Manage your submission and view your evaluation scores
          </p>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <i
                className={`bi ${
                  submission
                    ? "bi-check-circle-fill text-success"
                    : "bi-exclamation-circle-fill text-warning"
                } fs-1`}
              ></i>
              <h5 className="card-title mt-3">Submission Status</h5>
              <p className="card-text">
                {submission ? (
                  <span className="badge bg-success">Submitted</span>
                ) : (
                  <span className="badge bg-warning text-dark">
                    Not Submitted
                  </span>
                )}
              </p>
              {submission && (
                <small className="text-muted">
                  Last updated:{" "}
                  {new Date(
                    submission.updatedAt || submission.submittedAt
                  ).toLocaleDateString()}
                </small>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <i className="bi bi-clipboard-check fs-1 text-primary"></i>
              <h5 className="card-title mt-3">Evaluations</h5>
              <p className="card-text">
                {submission ? (
                  <>
                    <span className="badge bg-info">
                      {submission.evaluationCount || 0}/3 Complete
                    </span>
                    {submission.averageScore !== null &&
                      submission.averageScore !== undefined && (
                        <div className="mt-2">
                          <strong className="text-primary fs-4">
                            {submission.averageScore.toFixed(2)}
                          </strong>
                          <span className="text-muted">/100</span>
                        </div>
                      )}
                  </>
                ) : (
                  <span className="badge bg-secondary">Pending Submission</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card text-center h-100 border-info">
            <div className="card-body">
              <div className="position-relative d-inline-block">
                <i className="bi bi-chat-left-text fs-1 text-info"></i>
                {unreadFeedbackCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unreadFeedbackCount}
                  </span>
                )}
              </div>
              <h5 className="card-title mt-3">Feedback</h5>
              <p className="card-text">
                <Link to="/team/feedback" className="btn btn-sm btn-info">
                  <i className="bi bi-eye me-1"></i>
                  View Feedback
                </Link>
              </p>
              {unreadFeedbackCount > 0 && (
                <small className="text-info">
                  {unreadFeedbackCount} new message
                  {unreadFeedbackCount > 1 ? "s" : ""}
                </small>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <SubmissionForm onSubmissionUpdate={handleSubmissionUpdate} />
        </div>
      </div>

      {submission && (
        <div className="row mb-4">
          <div className="col-12">
            <ScoreView />
          </div>
        </div>
      )}

      {/* Chat Support Widget */}
      {user && user.id && <ChatSupport teamId={user.id} />}
    </div>
  );
};

export default TeamDashboard;
