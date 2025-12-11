import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalEvaluators: 0,
    approvedEvaluators: 0,
    pendingEvaluators: 0,
    totalSubmissions: 0,
    completedEvaluations: 0,
    totalEvaluations: 0,
    resultsPublished: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashStats();
  }, []);

  const getDashStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const teamsResponse = await api.get("/admin/teams");
      const teams = teamsResponse.data.teams || [];

      const evaluatorsResponse = await api.get("/admin/evaluators");
      const evaluators = evaluatorsResponse.data.evaluators || [];

      const pendingResponse = await api.get("/admin/pending-evaluators");
      const pendingEvaluators = pendingResponse.data.evaluators || [];

      const statusResponse = await api.get("/admin/evaluation-status");
      const evaluationStatus = statusResponse.data;

      let resultsPublished = false;
      try {
        const leaderboardResponse = await api.get("/public/leaderboard");
        resultsPublished = leaderboardResponse.data.published || false;
      } catch (err) {
        resultsPublished = false;
      }

      setStats({
        totalTeams: teams.length,
        totalEvaluators: evaluators.length,
        approvedEvaluators: evaluators.filter((e) => e.approved).length,
        pendingEvaluators: pendingEvaluators.length,
        totalSubmissions: teams.filter((t) => t.hasSubmission).length,
        completedEvaluations: evaluationStatus.completed || 0,
        totalEvaluations: evaluationStatus.total || 0,
        resultsPublished,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.message || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
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
          <h2>Admin Dashboard</h2>
          <p className="text-muted">
            Manage evaluators, assignments, and publish results
          </p>
        </div>
      </div>

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

      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-center h-100 border-primary">
            <div className="card-body">
              <i className="bi bi-people-fill fs-1 text-primary"></i>
              <h5 className="card-title mt-3">Total Teams</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-primary">
                  {stats.totalTeams}
                </span>
              </p>
              <small className="text-muted">Registered teams</small>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center h-100 border-success">
            <div className="card-body">
              <i className="bi bi-person-check-fill fs-1 text-success"></i>
              <h5 className="card-title mt-3">Evaluators</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-success">
                  {stats.approvedEvaluators}
                </span>
                <span className="text-muted">/{stats.totalEvaluators}</span>
              </p>
              <small className="text-muted">Approved evaluators</small>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center h-100 border-warning">
            <div className="card-body">
              <i className="bi bi-hourglass-split fs-1 text-warning"></i>
              <h5 className="card-title mt-3">Pending Approvals</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-warning">
                  {stats.pendingEvaluators}
                </span>
              </p>
              <small className="text-muted">Awaiting approval</small>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card text-center h-100 border-info">
            <div className="card-body">
              <i className="bi bi-clipboard-check fs-1 text-info"></i>
              <h5 className="card-title mt-3">Evaluations</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-info">
                  {stats.completedEvaluations}
                </span>
                <span className="text-muted">/{stats.totalEvaluations}</span>
              </p>
              <small className="text-muted">Completed evaluations</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-sm-6 col-md-3">
                  <button
                    className="btn btn-warning w-100 d-flex flex-column align-items-center py-3"
                    onClick={() => navigate("/admin/evaluator-approval")}
                  >
                    <i className="bi bi-person-check fs-2 mb-2"></i>
                    <span>Approve Evaluators</span>
                    {stats.pendingEvaluators > 0 && (
                      <span className="badge bg-danger mt-2">
                        {stats.pendingEvaluators} pending
                      </span>
                    )}
                  </button>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <button
                    className="btn btn-primary w-100 d-flex flex-column align-items-center py-3"
                    onClick={() => navigate("/admin/assignments")}
                  >
                    <i className="bi bi-diagram-3 fs-2 mb-2"></i>
                    <span>Manage Assignments</span>
                  </button>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <button
                    className="btn btn-info w-100 d-flex flex-column align-items-center py-3"
                    onClick={() => navigate("/admin/users")}
                  >
                    <i className="bi bi-people fs-2 mb-2"></i>
                    <span>Manage Users</span>
                  </button>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <button
                    className="btn btn-success w-100 d-flex flex-column align-items-center py-3"
                    onClick={() => navigate("/admin/publish-results")}
                    disabled={stats.resultsPublished}
                  >
                    <i className="bi bi-trophy fs-2 mb-2"></i>
                    <span>Publish Results</span>
                    {stats.resultsPublished && (
                      <span className="badge bg-light text-success mt-2">
                        Published
                      </span>
                    )}
                  </button>
                </div>

                <div className="col-12 col-sm-6 col-md-3">
                  <button
                    className="btn btn-secondary w-100 d-flex flex-column align-items-center py-3"
                    onClick={() => navigate("/admin/support")}
                  >
                    <i className="bi bi-headset fs-2 mb-2"></i>
                    <span>Support Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">System Status Overview</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <h6 className="text-muted mb-3">Registration Status</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Teams Registered:</span>
                    <strong>{stats.totalTeams}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Evaluators Approved:</span>
                    <strong>{stats.approvedEvaluators}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Pending Approvals:</span>
                    <strong className="text-warning">
                      {stats.pendingEvaluators}
                    </strong>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <h6 className="text-muted mb-3">Evaluation Progress</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Total Evaluations:</span>
                    <strong>{stats.totalEvaluations}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Completed:</span>
                    <strong className="text-success">
                      {stats.completedEvaluations}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Completion Rate:</span>
                    <strong>
                      {stats.totalEvaluations > 0
                        ? `${(
                            (stats.completedEvaluations /
                              stats.totalEvaluations) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </strong>
                  </div>
                  <div className="progress mt-2" style={{ height: "10px" }}>
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{
                        width: `${
                          stats.totalEvaluations > 0
                            ? (stats.completedEvaluations /
                                stats.totalEvaluations) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="row mt-3">
                <div className="col-12">
                  <div
                    className={`alert ${
                      stats.resultsPublished ? "alert-success" : "alert-info"
                    } mb-0`}
                  >
                    <i
                      className={`bi ${
                        stats.resultsPublished
                          ? "bi-check-circle-fill"
                          : "bi-info-circle-fill"
                      } me-2`}
                    ></i>
                    {stats.resultsPublished ? (
                      <span>
                        Results have been published and are visible to all
                        users.
                      </span>
                    ) : (
                      <span>
                        Results are not yet published. Complete all evaluations
                        to publish results.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
