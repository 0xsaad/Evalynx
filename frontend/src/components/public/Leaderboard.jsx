import { useState, useEffect } from "react";
import api from "../../services/api";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishedAt, setPublishedAt] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/public/leaderboard");

      if (response.data.success) {
        setPublished(response.data.published);
        setLeaderboard(response.data.leaderboard || []);
        setPublishedAt(response.data.publishedAt);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaderboard = leaderboard.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getBadgeClass = (rank) => {
    if (rank === 1) return "bg-warning text-dark"; // Gold
    if (rank === 2) return "bg-secondary text-white"; // Silver
    if (rank === 3) return "bg-danger text-white"; // Bronze
    return "bg-primary text-white";
  };

  const getBadgeIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="row">
        <div className="col-12">
          <div className="text-center mb-4">
            <h1 className="display-4 fw-bold">
              <i className="bi bi-trophy-fill text-warning me-3"></i>
              Competition Leaderboard
            </h1>
            <p className="lead text-muted">
              Official rankings of all participating teams
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          {!published && !error && (
            <div className="alert alert-info text-center" role="alert">
              <i className="bi bi-info-circle-fill me-2"></i>
              <strong>Results Not Published Yet</strong>
              <p className="mb-0 mt-2">
                The competition results have not been published yet. Please
                check back later once the admin publishes the final results.
              </p>
            </div>
          )}

          {published && leaderboard.length === 0 && (
            <div className="alert alert-warning text-center" role="alert">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              No teams found in the leaderboard.
            </div>
          )}

          {published && leaderboard.length > 0 && (
            <>
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0">
                        <i className="bi bi-calendar-check me-2 text-success"></i>
                        Results Published
                      </h5>
                      {publishedAt && (
                        <small className="text-muted">
                          {new Date(publishedAt).toLocaleString()}
                        </small>
                      )}
                    </div>
                    <div className="text-end">
                      <h5 className="mb-0">
                        <i className="bi bi-people-fill me-2 text-primary"></i>
                        Total Teams: {leaderboard.length}
                      </h5>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th
                            scope="col"
                            className="text-center"
                            style={{ width: "100px" }}
                          >
                            Rank
                          </th>
                          <th scope="col">Team Name</th>
                          <th
                            scope="col"
                            className="text-center"
                            style={{ width: "150px" }}
                          >
                            Average Score
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLeaderboard.map((team) => {
                          const isTopThree = team.rank <= 3;
                          return (
                            <tr
                              key={team.teamId}
                              className={isTopThree ? "table-light" : ""}
                            >
                              <td className="text-center align-middle">
                                <span
                                  className={`badge ${getBadgeClass(
                                    team.rank
                                  )} fs-5 px-3 py-2`}
                                >
                                  {getBadgeIcon(team.rank)} {team.rank}
                                </span>
                              </td>
                              <td className="align-middle">
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-people-fill me-2 text-primary"></i>
                                  <span className={isTopThree ? "fw-bold" : ""}>
                                    {team.teamName}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center align-middle">
                                <span className="badge bg-success fs-6 px-3 py-2">
                                  {team.averageScore.toFixed(2)} / 100
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Leaderboard pagination" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i> Previous
                      </button>
                    </li>

                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      const showPage =
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 &&
                          pageNumber <= currentPage + 1);

                      const showEllipsisBefore =
                        pageNumber === currentPage - 2 && currentPage > 3;
                      const showEllipsisAfter =
                        pageNumber === currentPage + 2 &&
                        currentPage < totalPages - 2;

                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <li key={pageNumber} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }

                      if (!showPage) return null;

                      return (
                        <li
                          key={pageNumber}
                          className={`page-item ${
                            currentPage === pageNumber ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        </li>
                      );
                    })}

                    <li
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>

                  <div className="text-center text-muted">
                    <small>
                      Showing {startIndex + 1} -{" "}
                      {Math.min(endIndex, leaderboard.length)} of{" "}
                      {leaderboard.length} teams
                    </small>
                  </div>
                </nav>
              )}

              {/* Top 3 Highlight Section */}
              {leaderboard.length >= 3 && currentPage === 1 && (
                <div className="row mt-5">
                  <div className="col-12">
                    <h3 className="text-center mb-4">
                      <i className="bi bi-star-fill text-warning me-2"></i>
                      Top 3 Teams
                    </h3>
                  </div>

                  {/* 2nd Place */}
                  <div className="col-md-4 mb-3">
                    <div className="card h-100 border-secondary">
                      <div className="card-body text-center">
                        <div className="display-1 mb-3">🥈</div>
                        <h5 className="card-title">2nd Place</h5>
                        <h4 className="fw-bold">{leaderboard[1].teamName}</h4>
                        <p className="text-muted mb-0">Score</p>
                        <h3 className="text-secondary">
                          {leaderboard[1].averageScore.toFixed(2)}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* 1st Place */}
                  <div className="col-md-4 mb-3">
                    <div className="card h-100 border-warning shadow-lg">
                      <div className="card-body text-center">
                        <div className="display-1 mb-3">🥇</div>
                        <h5 className="card-title text-warning">
                          1st Place - Champion!
                        </h5>
                        <h4 className="fw-bold">{leaderboard[0].teamName}</h4>
                        <p className="text-muted mb-0">Score</p>
                        <h3 className="text-warning">
                          {leaderboard[0].averageScore.toFixed(2)}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* 3rd Place */}
                  <div className="col-md-4 mb-3">
                    <div className="card h-100 border-danger">
                      <div className="card-body text-center">
                        <div className="display-1 mb-3">🥉</div>
                        <h5 className="card-title">3rd Place</h5>
                        <h4 className="fw-bold">{leaderboard[2].teamName}</h4>
                        <p className="text-muted mb-0">Score</p>
                        <h3 className="text-danger">
                          {leaderboard[2].averageScore.toFixed(2)}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
