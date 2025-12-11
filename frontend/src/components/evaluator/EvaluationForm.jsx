import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

const EVALUATION_CRITERIA = [
  {
    key: "relevanceToLearning",
    label: "Relevance to Learning Outcomes",
    weightage: 5,
  },
  {
    key: "innovationCreativity",
    label: "Innovation & Creativity",
    weightage: 15,
  },
  {
    key: "clarityAccessibility",
    label: "Clarity & Accessibility",
    weightage: 10,
  },
  { key: "depth", label: "Depth", weightage: 5 },
  {
    key: "interactivityEngagement",
    label: "Interactivity & Engagement",
    weightage: 25,
  },
  { key: "useOfTechnology", label: "Use of Technology", weightage: 5 },
  {
    key: "scalabilityAdaptability",
    label: "Scalability & Adaptability",
    weightage: 10,
  },
  {
    key: "ethicalStandards",
    label: "Alignment with Ethical Standards",
    weightage: 5,
  },
  {
    key: "practicalApplication",
    label: "Practical Application",
    weightage: 10,
  },
  { key: "videoQuality", label: "Video Quality", weightage: 10 },
];

const EvaluationForm = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [teamInfo, setTeamInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [existingEvaluation, setExistingEvaluation] = useState(null);

  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchTeamInfo();
  }, [teamId]);

  const fetchTeamInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const assignmentsResponse = await api.get("/evaluator/assignments");
      const assignmentsData =
        assignmentsResponse.data.data?.assignments ||
        assignmentsResponse.data.assignments ||
        [];
      const assignment = assignmentsData.find(
        (a) => a.teamId === teamId || a.teamId.toString() === teamId
      );

      if (!assignment) {
        setError("Team not found in your assignments");
        return;
      }

      setTeamInfo(assignment);

      if (assignment.evaluated) {
        try {
          const evaluationsResponse = await api.get("/evaluator/evaluations");
          const evaluationsData =
            evaluationsResponse.data.data?.evaluations ||
            evaluationsResponse.data.evaluations ||
            [];
          const evaluation = evaluationsData.find(
            (e) => e.teamId === teamId || e.teamId.toString() === teamId
          );

          if (evaluation) {
            setExistingEvaluation(evaluation);
            const existingScores = {};
            const existingComments = {};

            EVALUATION_CRITERIA.forEach((criterion) => {
              if (evaluation.scores[criterion.key]) {
                existingScores[criterion.key] =
                  evaluation.scores[criterion.key].score;
                existingComments[criterion.key] =
                  evaluation.scores[criterion.key].comment || "";
              }
            });

            setScores(existingScores);
            setComments(existingComments);
          }
        } catch (err) {
          console.error("Error fetching existing evaluation:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching team info:", err);
      setError(err.message || "Failed to load team information");
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (criterionKey, value) => {
    if (value === "") {
      setScores((prev) => ({
        ...prev,
        [criterionKey]: "",
      }));
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        setScores((prev) => ({
          ...prev,
          [criterionKey]: numValue,
        }));
      }
    }

    if (validationErrors[criterionKey]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[criterionKey];
        return newErrors;
      });
    }
  };

  const handleCommentChange = (criterionKey, value) => {
    setComments((prev) => ({
      ...prev,
      [criterionKey]: value,
    }));
  };

  const calculateTotalScore = () => {
    return EVALUATION_CRITERIA.reduce((total, criterion) => {
      const score = scores[criterion.key];
      return total + (typeof score === "number" ? score : 0);
    }, 0);
  };

  const validateForm = () => {
    const errors = {};

    EVALUATION_CRITERIA.forEach((criterion) => {
      const score = scores[criterion.key];

      if (score === undefined || score === null || score === "") {
        errors[criterion.key] = "Score is required";
      } else if (score < 0 || score > criterion.weightage) {
        errors[
          criterion.key
        ] = `Score must be between 0 and ${criterion.weightage}`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please fix the validation errors before submitting");
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setShowConfirmModal(false);

      const scoresData = {};
      EVALUATION_CRITERIA.forEach((criterion) => {
        scoresData[criterion.key] = {
          score: scores[criterion.key],
          comment: comments[criterion.key] || "",
        };
      });

      await api.post(`/evaluator/evaluate/${teamId}`, { scores: scoresData });

      alert("Evaluation submitted successfully!");
      navigate("/evaluator/dashboard");
    } catch (err) {
      console.error("Error submitting evaluation:", err);
      setError(err.message || "Failed to submit evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading evaluation form...</p>
        </div>
      </div>
    );
  }

  if (error && !teamInfo) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/evaluator/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const totalScore = calculateTotalScore();
  const isReadOnly = existingEvaluation !== null;

  return (
    <div className="container mt-4 mb-5">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <button
            className="btn btn-outline-secondary mb-3"
            onClick={() => navigate("/evaluator/dashboard")}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back to Dashboard
          </button>
          <h2>{isReadOnly ? "View Evaluation" : "Evaluate Team"}</h2>
          <p className="text-muted">
            {isReadOnly
              ? "Your submitted evaluation for "
              : "Submit your evaluation for "}
            <strong>{teamInfo?.teamName}</strong>
          </p>
        </div>
      </div>

      {/* Team Info Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h5 className="mb-2">{teamInfo?.teamName}</h5>
                  <p className="text-muted mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Team ID: {teamInfo?.teamId}
                  </p>
                </div>
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  {teamInfo?.videoUrl && (
                    <a
                      href={teamInfo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                    >
                      <i className="bi bi-play-circle me-2"></i>
                      View Submission
                    </a>
                  )}
                </div>
              </div>
            </div>
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

      {/* Read-only Notice */}
      {isReadOnly && (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          This evaluation has already been submitted and cannot be modified.
        </div>
      )}

      {/* Evaluation Form */}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Evaluation Criteria</h5>
              </div>
              <div className="card-body">
                {EVALUATION_CRITERIA.map((criterion, index) => (
                  <div key={criterion.key} className="mb-4 pb-4 border-bottom">
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label className="form-label fw-bold">
                          {index + 1}. {criterion.label}
                          <span className="badge bg-primary ms-2">
                            Max: {criterion.weightage} points
                          </span>
                        </label>

                        <div className="row">
                          <div className="col-md-4">
                            <input
                              type="number"
                              className={`form-control ${
                                validationErrors[criterion.key]
                                  ? "is-invalid"
                                  : ""
                              }`}
                              placeholder={`0 - ${criterion.weightage}`}
                              min="0"
                              max={criterion.weightage}
                              step="1"
                              value={
                                scores[criterion.key] === ""
                                  ? ""
                                  : scores[criterion.key]
                              }
                              onChange={(e) =>
                                handleScoreChange(criterion.key, e.target.value)
                              }
                              onBlur={(e) => {
                                // Validate on blur
                                const val = parseInt(e.target.value, 10);
                                if (
                                  !isNaN(val) &&
                                  (val < 0 || val > criterion.weightage)
                                ) {
                                  setValidationErrors((prev) => ({
                                    ...prev,
                                    [criterion.key]: `Score must be between 0 and ${criterion.weightage}`,
                                  }));
                                }
                              }}
                              disabled={isReadOnly}
                              required
                            />
                            {validationErrors[criterion.key] && (
                              <div className="invalid-feedback">
                                {validationErrors[criterion.key]}
                              </div>
                            )}
                          </div>
                          <div className="col-md-8">
                            <div className="input-group">
                              <span className="input-group-text">
                                <i className="bi bi-chat-left-text"></i>
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Add comment (optional)"
                                value={comments[criterion.key] || ""}
                                onChange={(e) =>
                                  handleCommentChange(
                                    criterion.key,
                                    e.target.value
                                  )
                                }
                                disabled={isReadOnly}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Total Score */}
          <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: "20px" }}>
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Total Score</h5>
              </div>
              <div className="card-body text-center">
                <div className="display-3 fw-bold text-primary mb-2">
                  {totalScore}
                </div>
                <p className="text-muted mb-0">out of 100 points</p>

                <div className="progress mt-3" style={{ height: "25px" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${totalScore}%` }}
                    aria-valuenow={totalScore}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {totalScore}%
                  </div>
                </div>
              </div>

              {!isReadOnly && (
                <div className="card-footer">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Submit Evaluation
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Criteria Summary */}
            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">Criteria Summary</h6>
              </div>
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {EVALUATION_CRITERIA.map((criterion) => (
                    <div
                      key={criterion.key}
                      className="list-group-item d-flex justify-content-between align-items-center py-2"
                    >
                      <small
                        className="text-truncate me-2"
                        title={criterion.label}
                      >
                        {criterion.label}
                      </small>
                      <span className="badge bg-secondary">
                        {scores[criterion.key] ?? 0}/{criterion.weightage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Submission</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to submit this evaluation?</p>
                <div className="alert alert-warning mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Note:</strong> Once submitted, you cannot modify this
                  evaluation.
                </div>
                <div className="mt-3">
                  <p className="mb-1">
                    <strong>Team:</strong> {teamInfo?.teamName}
                  </p>
                  <p className="mb-0">
                    <strong>Total Score:</strong> {totalScore}/100
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    "Confirm & Submit"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationForm;
