import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const ResultPublisher = () => {
  const navigate = useNavigate();
  const [evaluationStatus, setEvaluationStatus] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    percentage: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusResponse = await api.get("/admin/evaluation-status");
      const statusData = statusResponse.data || {};
      setEvaluationStatus({
        total: statusData.totalEvaluationsRequired || 0,
        completed: statusData.totalEvaluationsCompleted || 0,
        pending:
          (statusData.totalEvaluationsRequired || 0) -
          (statusData.totalEvaluationsCompleted || 0),
        percentage: statusData.completionPercentage || 0,
      });

      try {
        const leaderboardResponse = await api.get("/public/leaderboard");
        if (leaderboardResponse.data.published) {
          setIsPublished(true);
          setLeaderboard(leaderboardResponse.data.leaderboard || []);
        } else {
          setLeaderboard([]);
        }
      } catch (err) {
        console.log("Leaderboard not published yet");
        setLeaderboard([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const publishResults = async () => {
    if (evaluationStatus.percentage < 100) {
      if (
        !window.confirm(
          `Only ${evaluationStatus.percentage.toFixed(
            1
          )}% of evaluations are complete. ` +
            "Are you sure you want to publish results now?"
        )
      ) {
        return;
      }
    } else {
      if (
        !window.confirm(
          "This will make the final results and leaderboard visible to all users. Continue?"
        )
      ) {
        return;
      }
    }

    try {
      setPublishing(true);
      setError(null);

      const response = await api.post("/admin/publish-results");

      setSuccess("Results published successfully!");
      setIsPublished(true);

      if (response.data.leaderboard) {
        setLeaderboard(response.data.leaderboard);
      }

      await fetchData();
    } catch (err) {
      console.error("Error publishing results:", err);
      setError(err.message || "Failed to publish results");
    } finally {
      setPublishing(false);
    }
  };

  const canPublish = evaluationStatus.completed > 0 && !isPublished;

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading evaluation status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Publish Results</h2>
              <p className="text-muted">
                Review evaluation completion and publish final results
              </p>
            </div>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate("/admin/dashboard")}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

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

      {isPublished && (
        <div className="alert alert-success" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          <strong>Results Published!</strong> The leaderboard is now visible to
          all users.
        </div>
      )}

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Evaluation Completion Status</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Note:</strong> Each team requires 3 evaluations (one
                from each evaluator) to calculate their final score.
              </div>

              <div className="row mb-3">
                <div className="col-md-4 text-center">
                  <div className="mb-2">
                    <i className="bi bi-clipboard-check fs-1 text-primary"></i>
                  </div>
                  <h3 className="mb-0">
                    {evaluationStatus.completed}/{evaluationStatus.total}
                  </h3>
                  <small className="text-muted">Evaluations Submitted</small>
                </div>
                <div className="col-md-4 text-center">
                  <div className="mb-2">
                    <i className="bi bi-check-circle-fill fs-1 text-success"></i>
                  </div>
                  <h3 className="mb-0">
                    {Math.round(
                      (evaluationStatus.completed / evaluationStatus.total) *
                        100
                    )}
                    %
                  </h3>
                  <small className="text-muted">Progress</small>
                </div>
                <div className="col-md-4 text-center">
                  <div className="mb-2">
                    <i className="bi bi-hourglass-split fs-1 text-warning"></i>
                  </div>
                  <h3 className="mb-0">{evaluationStatus.pending}</h3>
                  <small className="text-muted">Still Pending</small>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-2">
                  <span>Overall Evaluation Progress</span>
                  <strong>
                    {Math.round(
                      (evaluationStatus.completed / evaluationStatus.total) *
                        100
                    )}
                    %
                  </strong>
                </div>
                <div className="progress" style={{ height: "25px" }}>
                  <div
                    className={`progress-bar ${
                      evaluationStatus.completed === evaluationStatus.total
                        ? "bg-success"
                        : "bg-primary"
                    }`}
                    role="progressbar"
                    style={{
                      width: `${
                        (evaluationStatus.completed / evaluationStatus.total) *
                        100
                      }%`,
                    }}
                  >
                    {evaluationStatus.completed > 0 &&
                      `${Math.round(
                        (evaluationStatus.completed / evaluationStatus.total) *
                          100
                      )}%`}
                  </div>
                </div>
              </div>

              {evaluationStatus.completed < evaluationStatus.total && (
                <div className="alert alert-warning mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Warning:</strong> {evaluationStatus.pending}{" "}
                  evaluation(s) still pending. Teams without 3 complete
                  evaluations will not appear in the leaderboard.
                </div>
              )}

              {evaluationStatus.completed === evaluationStatus.total &&
                !isPublished && (
                  <div className="alert alert-success mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Ready to Publish:</strong> All{" "}
                    {evaluationStatus.total} evaluations are complete! You can
                    now publish the final results and leaderboard.
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                {isPublished ? "Published Leaderboard" : "Leaderboard Preview"}
              </h5>
            </div>
            <div className="card-body">
              {leaderboard.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="text-muted mt-3">
                    No evaluation data available yet
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: "80px" }}>Rank</th>
                        <th>Team Name</th>
                        <th className="text-center">Evaluations</th>
                        <th className="text-end">Average Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((team) => (
                        <tr key={team.teamId}>
                          <td>
                            {team.rank <= 3 ? (
                              <span className="badge bg-warning text-dark fs-6">
                                <i
                                  className={`bi ${
                                    team.rank === 1
                                      ? "bi-trophy-fill"
                                      : team.rank === 2
                                      ? "bi-award-fill"
                                      : "bi-star-fill"
                                  } me-1`}
                                ></i>
                                #{team.rank}
                              </span>
                            ) : (
                              <span className="fs-5">#{team.rank}</span>
                            )}
                          </td>
                          <td>
                            <strong>{team.teamName}</strong>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${
                                team.evaluationCount === 3
                                  ? "bg-success"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {team.evaluationCount}/3
                            </span>
                          </td>
                          <td className="text-end">
                            <strong className="fs-5">
                              {team.averageScore !== null &&
                              team.averageScore !== undefined
                                ? team.averageScore.toFixed(2)
                                : "N/A"}
                            </strong>
                            <span className="text-muted">/100</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body text-center">
              {isPublished ? (
                <div>
                  <i className="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
                  <h5 className="text-success">Results Already Published</h5>
                  <p className="text-muted">
                    The leaderboard is now visible to all users on the public
                    leaderboard page.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/leaderboard")}
                  >
                    <i className="bi bi-trophy me-2"></i>
                    View Public Leaderboard
                  </button>
                </div>
              ) : (
                <div>
                  <h5 className="mb-3">Publish Final Results</h5>
                  <p className="text-muted mb-4">
                    Once published, the leaderboard will be visible to all
                    users. This action cannot be undone.
                  </p>
                  <button
                    className="btn btn-success btn-lg"
                    onClick={publishResults}
                    disabled={!canPublish || publishing}
                  >
                    {publishing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trophy-fill me-2"></i>
                        Publish Results Now
                      </>
                    )}
                  </button>
                  {!canPublish && evaluationStatus.completed === 0 && (
                    <div className="alert alert-info mt-3 mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      No evaluations have been completed yet. Please wait for
                      evaluators to submit their assessments.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPublisher;
