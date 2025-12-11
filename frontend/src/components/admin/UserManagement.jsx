import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const UserManagement = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("teams"); // 'teams' or 'evaluators'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const teamsResponse = await api.get("/admin/teams");
      setTeams(teamsResponse.data.teams || []);

      const evaluatorsResponse = await api.get("/admin/evaluators");
      setEvaluators(evaluatorsResponse.data.evaluators || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = async (user) => {
    const userType = user.role === "team" ? "team" : "evaluator";
    const confirmMessage = `Are you sure you want to delete this ${userType}?\n\nName: ${user.name}\nEmail: ${user.email}\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${user._id}`);

      await fetchUsers();

      alert(
        `${
          userType.charAt(0).toUpperCase() + userType.slice(1)
        } deleted successfully`
      );
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.message || `Failed to delete ${userType}`);
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvaluators = evaluators.filter(
    (evaluator) =>
      evaluator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluator.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading users...</p>
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
              <h2>User Management</h2>
              <p className="text-muted">View and manage all registered users</p>
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
        <div className="col-md-6 mb-3">
          <div className="card text-center h-100 border-primary">
            <div className="card-body">
              <i className="bi bi-people-fill fs-1 text-primary"></i>
              <h5 className="card-title mt-3">Total Teams</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-primary">
                  {teams.length}
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card text-center h-100 border-success">
            <div className="card-body">
              <i className="bi bi-person-check-fill fs-1 text-success"></i>
              <h5 className="card-title mt-3">Total Evaluators</h5>
              <p className="card-text">
                <span className="fs-2 fw-bold text-success">
                  {evaluators.length}
                </span>
              </p>
              <small className="text-muted">
                {evaluators.filter((e) => e.approved).length} approved,{" "}
                {evaluators.filter((e) => !e.approved).length} pending
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, email, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSearchTerm("")}
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "teams" ? "active" : ""}`}
                onClick={() => setActiveTab("teams")}
              >
                <i className="bi bi-people me-2"></i>
                Teams ({filteredTeams.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "evaluators" ? "active" : ""
                }`}
                onClick={() => setActiveTab("evaluators")}
              >
                <i className="bi bi-person-check me-2"></i>
                Evaluators ({filteredEvaluators.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {activeTab === "teams" && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Registered Teams</h5>
              </div>
              <div className="card-body">
                {filteredTeams.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="text-muted mt-3">
                      {searchTerm
                        ? "No teams found matching your search"
                        : "No teams registered yet"}
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Team Name</th>
                          <th>Email</th>
                          <th>Members</th>
                          <th>Registered</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeams.map((team) => (
                          <tr key={team._id}>
                            <td>
                              <strong>{team.name}</strong>
                            </td>
                            <td>{team.email}</td>
                            <td>
                              {team.teamMembers &&
                              team.teamMembers.length > 0 ? (
                                <span className="badge bg-info">
                                  {team.teamMembers.length} member
                                  {team.teamMembers.length !== 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="text-muted">
                                  Not specified
                                </span>
                              )}
                            </td>
                            <td>
                              <small className="text-muted">
                                {new Date(team.createdAt).toLocaleDateString()}
                              </small>
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleViewDetails(team)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                View Details
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteUser(team)}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Delete
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
      )}

      {activeTab === "evaluators" && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Registered Evaluators</h5>
              </div>
              <div className="card-body">
                {filteredEvaluators.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox fs-1 text-muted"></i>
                    <p className="text-muted mt-3">
                      {searchTerm
                        ? "No evaluators found matching your search"
                        : "No evaluators registered yet"}
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Expertise</th>
                          <th className="text-center">Status</th>
                          <th>Registered</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEvaluators.map((evaluator) => (
                          <tr key={evaluator._id}>
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
                                <span className="text-muted">
                                  Not specified
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              {evaluator.approved ? (
                                <span className="badge bg-success">
                                  <i className="bi bi-check-circle me-1"></i>
                                  Approved
                                </span>
                              ) : (
                                <span className="badge bg-warning text-dark">
                                  <i className="bi bi-hourglass-split me-1"></i>
                                  Pending
                                </span>
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
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleViewDetails(evaluator)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                View Details
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteUser(evaluator)}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Delete
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
      )}

      {showDetailsModal && selectedUser && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {selectedUser.role === "team" ? "Team" : "Evaluator"} Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Name:</strong>
                    <p>{selectedUser.name}</p>
                  </div>
                  <div className="col-md-6">
                    <strong>Email:</strong>
                    <p>{selectedUser.email}</p>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Role:</strong>
                    <p>
                      <span className="badge bg-primary">
                        {selectedUser.role}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <strong>Registered:</strong>
                    <p>{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {selectedUser.role === "team" && selectedUser.teamMembers && (
                  <div className="row mb-3">
                    <div className="col-12">
                      <strong>Team Members:</strong>
                      {selectedUser.teamMembers.length > 0 ? (
                        <ul className="list-group mt-2">
                          {selectedUser.teamMembers.map((member, idx) => (
                            <li key={idx} className="list-group-item">
                              {member}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted">No team members specified</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedUser.role === "evaluator" && (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Expertise:</strong>
                        <p>
                          {selectedUser.expertise ? (
                            <span className="badge bg-info">
                              {selectedUser.expertise}
                            </span>
                          ) : (
                            <span className="text-muted">Not specified</span>
                          )}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <strong>Approval Status:</strong>
                        <p>
                          {selectedUser.approved ? (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              Approved
                            </span>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-hourglass-split me-1"></i>
                              Pending Approval
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <div className="row">
                  <div className="col-12">
                    <strong>User ID:</strong>
                    <p className="text-muted small font-monospace">
                      {selectedUser._id}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
