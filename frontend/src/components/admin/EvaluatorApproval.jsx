import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const EvaluatorApproval = () => {
  const navigate = useNavigate();
  const [pendingEvaluators, setPendingEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedEvaluators, setSelectedEvaluators] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    getPendingEval();
  }, []);

  const getPendingEval = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/admin/pending-evaluators");
      setPendingEvaluators(response.data.evaluators || []);
    } catch (err) {
      console.error("Error fetching pending evaluators:", err);
      setError(err.message || "Failed to load pending evaluators");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (evaluatorId) => {
    try {
      setProcessingId(evaluatorId);
      setError(null);
      await api.put(`/admin/approve-evaluator/${evaluatorId}`, {
        approved: true,
      });
      setSuccess("Evaluator approved successfully!");

      setPendingEvaluators((prev) => prev.filter((e) => e._id !== evaluatorId));
      setSelectedEvaluators((prev) => prev.filter((id) => id !== evaluatorId));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error approving evaluator:", err);
      setError(err.message || "Failed to approve evaluator");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (evaluatorId) => {
    if (
      !window.confirm(
        "Are you sure you want to reject this evaluator? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setProcessingId(evaluatorId);
      setError(null);
      await api.put(`/admin/approve-evaluator/${evaluatorId}`, {
        approved: false,
      });
      setSuccess("Evaluator rejected successfully!");

      setPendingEvaluators((prev) => prev.filter((e) => e._id !== evaluatorId));
      setSelectedEvaluators((prev) => prev.filter((id) => id !== evaluatorId));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error rejecting evaluator:", err);
      setError(err.message || "Failed to reject evaluator");
    } finally {
      setProcessingId(null);
    }
  };

  const pickEvaluator = (evaluatorId) => {
    setSelectedEvaluators((prev) => {
      if (prev.includes(evaluatorId)) {
        return prev.filter((id) => id !== evaluatorId);
      } else {
        return [...prev, evaluatorId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedEvaluators.length === pendingEvaluators.length) {
      setSelectedEvaluators([]);
    } else {
      setSelectedEvaluators(pendingEvaluators.map((e) => e._id));
    }
  };

  const bulkApprove = async () => {
    if (selectedEvaluators.length === 0) {
      setError("Please select at least one evaluator to approve");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to approve ${selectedEvaluators.length} evaluator(s)?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const promises = selectedEvaluators.map((id) =>
        api.put(`/admin/approve-evaluator/${id}`, { approved: true })
      );

      await Promise.all(promises);

      setSuccess(
        `Successfully approved ${selectedEvaluators.length} evaluator(s)!`
      );

      setPendingEvaluators((prev) =>
        prev.filter((e) => !selectedEvaluators.includes(e._id))
      );
      setSelectedEvaluators([]);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error bulk approving evaluators:", err);
      setError(err.message || "Failed to approve some evaluators");
    } finally {
      setLoading(false);
    }
  };

  if (loading && pendingEvaluators.length === 0) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading pending evaluators...</p>
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
              <h2>Evaluator Approval</h2>
              <p className="text-muted">
                Review and approve pending evaluator registrations
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

      {pendingEvaluators.length > 0 && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={handleSelectAll}
                >
                  <i className="bi bi-check-square me-1"></i>
                  {selectedEvaluators.length === pendingEvaluators.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                {selectedEvaluators.length > 0 && (
                  <span className="text-muted">
                    {selectedEvaluators.length} selected
                  </span>
                )}
              </div>
              {selectedEvaluators.length > 0 && (
                <button
                  className="btn btn-sm btn-success"
                  onClick={bulkApprove}
                  disabled={loading}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Approve Selected ({selectedEvaluators.length})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                Pending Evaluators ({pendingEvaluators.length})
              </h5>
            </div>
            <div className="card-body">
              {pendingEvaluators.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="text-muted mt-3">
                    No pending evaluator approvals
                  </p>
                  <button
                    className="btn btn-primary mt-2"
                    onClick={() => navigate("/admin/dashboard")}
                  >
                    Back to Dashboard
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={
                              selectedEvaluators.length ===
                              pendingEvaluators.length
                            }
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Expertise</th>
                        <th>Registered</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingEvaluators.map((evaluator) => (
                        <tr key={evaluator._id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedEvaluators.includes(
                                evaluator._id
                              )}
                              onChange={() => pickEvaluator(evaluator._id)}
                            />
                          </td>
                          <td>
                            <strong>{evaluator.name}</strong>
                          </td>
                          <td>{evaluator.email}</td>
                          <td>
                            {evaluator.expertise ? (
                              <span className="badge bg-info">
                                {evaluator.expertise}
                              </span>
                            ) : (
                              <span className="text-muted">Not specified</span>
                            )}
                          </td>
                          <td>
                            <small className="text-muted">
                              {new Date(
                                evaluator.createdAt
                              ).toLocaleDateString()}
                            </small>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleApprove(evaluator._id)}
                              disabled={processingId === evaluator._id}
                            >
                              {processingId === evaluator._id ? (
                                <span className="spinner-border spinner-border-sm me-1"></span>
                              ) : (
                                <i className="bi bi-check-circle me-1"></i>
                              )}
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleReject(evaluator._id)}
                              disabled={processingId === evaluator._id}
                            >
                              {processingId === evaluator._id ? (
                                <span className="spinner-border spinner-border-sm me-1"></span>
                              ) : (
                                <i className="bi bi-x-circle me-1"></i>
                              )}
                              Reject
                            </button>
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
    </div>
  );
};

export default EvaluatorApproval;
