import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const AssignmentManager = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedEvaluators, setSelectedEvaluators] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const teamsResponse = await api.get("/admin/teams");
      const teamsData = teamsResponse.data.teams || [];
      setTeams(teamsData);

      const evaluatorsResponse = await api.get("/admin/evaluators");
      const evaluatorsData = evaluatorsResponse.data.evaluators || [];
      setEvaluators(evaluatorsData.filter((e) => e.approved));

      try {
        const assignmentsResponse = await api.get("/admin/assignments");
        const assignmentsData = assignmentsResponse.data.assignments || [];

        const assignmentsMap = {};
        assignmentsData.forEach((assignment) => {
          assignmentsMap[assignment.teamId] = assignment.evaluatorIds || [];
        });
        setAssignments(assignmentsMap);
        console.log("Assignments loaded:", assignmentsMap);
      } catch (assignErr) {
        console.error("Error fetching assignments:", assignErr);
        setAssignments({});
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const onManualAssignClick = (team) => {
    setSelectedTeam(team);
    setSelectedEvaluators(assignments[team._id] || []);
    setShowManualAssign(true);
  };

  const toggleEvaluator = (evaluatorId) => {
    setSelectedEvaluators((prev) => {
      if (prev.includes(evaluatorId)) {
        return prev.filter((id) => id !== evaluatorId);
      } else {
        if (prev.length >= 3) {
          setError("You can only assign up to 3 evaluators per team");
          return prev;
        }
        return [...prev, evaluatorId];
      }
    });
  };

  const submitManualAssign = async () => {
    if (selectedEvaluators.length !== 3) {
      setError("Please select exactly 3 evaluators");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await api.post("/admin/assign-evaluators", {
        mode: "manual",
        manual: [
          {
            teamId: selectedTeam._id,
            evaluatorIds: selectedEvaluators,
          },
        ],
      });

      setSuccess(`Successfully assigned evaluators to ${selectedTeam.name}!`);

      setAssignments((prev) => ({
        ...prev,
        [selectedTeam._id]: selectedEvaluators,
      }));

      setShowManualAssign(false);
      setSelectedTeam(null);
      setSelectedEvaluators([]);

      await fetchData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error manually assigning evaluators:", err);
      setError(err.message || "Failed to assign evaluators");
    } finally {
      setLoading(false);
    }
  };

  const getEvaluatorName = (evaluatorId) => {
    const evaluator = evaluators.find((e) => e._id === evaluatorId);
    return evaluator ? evaluator.name : "Unknown";
  };

  const getEvaluatorWorkload = (evaluatorId) => {
    let count = 0;
    Object.values(assignments).forEach((assignedEvaluators) => {
      if (assignedEvaluators.includes(evaluatorId)) {
        count++;
      }
    });
    return count;
  };

  if (loading && teams.length === 0) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading assignment data...</p>
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
              <h2>Assignment Manager</h2>
              <p className="text-muted">Assign evaluators to teams</p>
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

      <div className="row mb-4">
        <div className="col-12 mb-4">
          <div className="card border-success">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-check-circle-fill me-2"></i>
                Evaluators Assigned
              </h5>
            </div>
            <div className="card-body">
              {teams.filter(
                (team) => (assignments[team._id] || []).length === 3
              ).length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="text-muted mt-3 mb-0">
                    No teams have complete assignments yet
                  </p>
                  <small className="text-muted">
                    Use auto-assign or manually assign 3 evaluators to each team
                  </small>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Team Name</th>
                        <th>Assigned Evaluators</th>
                        <th className="text-center">Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams
                        .filter(
                          (team) => (assignments[team._id] || []).length === 3
                        )
                        .map((team) => {
                          const teamAssignments = assignments[team._id] || [];

                          return (
                            <tr key={team._id}>
                              <td>
                                <strong>{team.name}</strong>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {teamAssignments.map((evalId, idx) => (
                                    <span
                                      key={idx}
                                      className="badge bg-primary"
                                    >
                                      {getEvaluatorName(evalId)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="text-center">
                                <span className="badge bg-success">
                                  <i className="bi bi-check-circle me-1"></i>
                                  Complete (3/3)
                                </span>
                              </td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => onManualAssignClick(team)}
                                >
                                  <i className="bi bi-pencil me-1"></i>
                                  Reassign
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-warning">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Need Evaluators
              </h5>
            </div>
            <div className="card-body">
              {teams.filter((team) => (assignments[team._id] || []).length < 3)
                .length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-check-circle-fill fs-1 text-success"></i>
                  <p className="text-success mt-3 mb-0">
                    <strong>Every team has 3 evaluators assigned!</strong>
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Team Name</th>
                        <th>Assigned Evaluators</th>
                        <th className="text-center">Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams
                        .filter(
                          (team) => (assignments[team._id] || []).length < 3
                        )
                        .map((team) => {
                          const teamAssignments = assignments[team._id] || [];

                          return (
                            <tr key={team._id}>
                              <td>
                                <strong>{team.name}</strong>
                              </td>
                              <td>
                                {teamAssignments.length > 0 ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {teamAssignments.map((evalId, idx) => (
                                      <span
                                        key={idx}
                                        className="badge bg-primary"
                                      >
                                        {getEvaluatorName(evalId)}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted">
                                    Not assigned
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                <span className="badge bg-warning text-dark">
                                  <i className="bi bi-exclamation-circle me-1"></i>
                                  {teamAssignments.length}/3
                                </span>
                              </td>
                              <td className="text-end">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => onManualAssignClick(team)}
                                >
                                  <i className="bi bi-plus-circle me-1"></i>
                                  Assign Now
                                </button>
                              </td>
                            </tr>
                          );
                        })}
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
            <div className="card-header">
              <h5 className="mb-0">Evaluator Workload Distribution</h5>
            </div>
            <div className="card-body">
              {evaluators.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-muted mb-0">
                    No approved evaluators available
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Evaluator Name</th>
                        <th>Email</th>
                        <th className="text-center">Assigned Teams</th>
                        <th style={{ width: "40%" }}>Workload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluators.map((evaluator) => {
                        const workload = getEvaluatorWorkload(evaluator._id);
                        const maxWorkload = teams.length;
                        const percentage =
                          maxWorkload > 0 ? (workload / maxWorkload) * 100 : 0;

                        return (
                          <tr key={evaluator._id}>
                            <td>{evaluator.name}</td>
                            <td>
                              <small className="text-muted">
                                {evaluator.email}
                              </small>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-info">{workload}</span>
                            </td>
                            <td>
                              <div
                                className="progress"
                                style={{ height: "20px" }}
                              >
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{ width: `${percentage}%` }}
                                >
                                  {workload > 0 && `${workload} teams`}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showManualAssign && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Assign Evaluators to {selectedTeam?.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowManualAssign(false);
                    setSelectedTeam(null);
                    setSelectedEvaluators([]);
                    setError(null);
                  }}
                ></button>
              </div>
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

                <p className="text-muted mb-3">
                  Select exactly 3 evaluators to assign to this team. Currently
                  selected: <strong>{selectedEvaluators.length}/3</strong>
                </p>

                <div className="list-group">
                  {evaluators.map((evaluator) => {
                    const isSelected = selectedEvaluators.includes(
                      evaluator._id
                    );
                    const workload = getEvaluatorWorkload(evaluator._id);

                    return (
                      <div
                        key={evaluator._id}
                        className={`list-group-item list-group-item-action ${
                          isSelected ? "active" : ""
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => toggleEvaluator(evaluator._id)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <input
                              type="checkbox"
                              className="form-check-input me-2"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                            <strong>{evaluator.name}</strong>
                            <br />
                            <small
                              className={
                                isSelected ? "text-white-50" : "text-muted"
                              }
                            >
                              {evaluator.email}
                            </small>
                          </div>
                          <div className="text-end">
                            <span
                              className={`badge ${
                                isSelected
                                  ? "bg-light text-dark"
                                  : "bg-secondary"
                              }`}
                            >
                              Current workload: {workload} teams
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowManualAssign(false);
                    setSelectedTeam(null);
                    setSelectedEvaluators([]);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={submitManualAssign}
                  disabled={selectedEvaluators.length !== 3 || loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Assign Evaluators
                    </>
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

export default AssignmentManager;
