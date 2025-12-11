import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import api from "../../services/api";
import logo from "../images/logo-Photoroom-highres.png";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await api.get("/auth/profile");
          if (response.data.success) {
            setProfileData(response.data.user);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        }
      } else {
        setProfileData(null);
      }
    };

    fetchProfile();
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsNavCollapsed(true);
    setProfileData(null);
  };

  const handleNavClick = () => {
    setIsNavCollapsed(true);
  };

  const getDashboardLink = () => {
    if (!user) return "/";
    switch (user.role) {
      case "team":
        return "/team/dashboard";
      case "evaluator":
        return "/evaluator/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container">
        <Link
          className="navbar-brand fw-bold d-flex align-items-center"
          to="/"
          onClick={handleNavClick}
        >
          <img 
            src={logo} 
            alt="EvalynX Logo" 
            style={{ height: '40px', width: 'auto' }}
          />
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded={!isNavCollapsed}
          aria-label="Toggle navigation"
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className={`collapse navbar-collapse ${isNavCollapsed ? "" : "show"}`}
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto align-items-lg-center">
            {!isAuthenticated && (
              <li className="nav-item">
                <Link
                  className="nav-link px-3 py-2"
                  to="/"
                  onClick={handleNavClick}
                >
                  <i className="bi bi-house-fill me-1 d-lg-none"></i>
                  Home
                </Link>
              </li>
            )}

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link px-3 py-2"
                    to="/leaderboard"
                    onClick={handleNavClick}
                  >
                    <i className="bi bi-trophy me-1 d-lg-none"></i>
                    Leaderboard
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className="nav-link px-3 py-2"
                    to={getDashboardLink()}
                    onClick={handleNavClick}
                  >
                    <i className="bi bi-speedometer2 me-1 d-lg-none"></i>
                    Dashboard
                  </Link>
                </li>

                {/* Mobile Logout Button */}
                <li className="nav-item d-lg-none">
                  <button
                    className="nav-link px-3 py-2 btn btn-link text-start w-100"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right me-1"></i>
                    Logout
                  </button>
                </li>

                {/* Desktop Profile Dropdown */}
                <li className="nav-item dropdown d-none d-lg-block">
                  <a
                    className="nav-link dropdown-toggle px-3 py-2"
                    href="#"
                    id="navbarDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.role === "admin" ? "Admin" : user?.name || "User"}
                  </a>
                  <ul
                    className="dropdown-menu dropdown-menu-end shadow"
                    aria-labelledby="navbarDropdown"
                    style={{ minWidth: "280px" }}
                  >
                    {/* Profile Header */}
                    <li className="px-3 py-2">
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{ width: "40px", height: "40px" }}
                        >
                          <i className="bi bi-person-fill text-white"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark">
                            {user?.role === "admin"
                              ? "Admin"
                              : profileData?.name || user?.name}
                          </div>
                          <div className="small text-muted">
                            {profileData?.email || user?.email}
                          </div>
                        </div>
                      </div>
                    </li>

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    {/* Role Information */}
                    <li className="px-3 py-1">
                      <div className="small text-muted mb-1">
                        <i className="bi bi-shield-check me-1"></i>
                        Role
                      </div>
                      <div className="fw-semibold">
                        <span
                          className={`badge ${
                            user?.role === "admin"
                              ? "bg-danger"
                              : user?.role === "evaluator"
                              ? "bg-success"
                              : "bg-primary"
                          }`}
                        >
                          {user?.role?.charAt(0).toUpperCase() +
                            user?.role?.slice(1)}
                        </span>
                        {user?.role === "evaluator" && (
                          <span
                            className={`badge ms-1 ${
                              profileData?.approved
                                ? "bg-success"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {profileData?.approved ? "Approved" : "Pending"}
                          </span>
                        )}
                      </div>
                    </li>

                    {/* Team Members (for teams) */}
                    {user?.role === "team" && profileData?.teamMembers && (
                      <>
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li className="px-3 py-1">
                          <div className="small text-muted mb-1">
                            <i className="bi bi-people me-1"></i>
                            Team Members ({profileData.teamMembers.length})
                          </div>
                          <div className="small">
                            {profileData.teamMembers.map((member, index) => (
                              <div key={index} className="text-dark">
                                <i
                                  className="bi bi-person-fill me-1"
                                  style={{ fontSize: "0.7rem" }}
                                ></i>
                                {member}
                                {index === 0 && (
                                  <span
                                    className="badge bg-secondary ms-1"
                                    style={{ fontSize: "0.6rem" }}
                                  >
                                    Lead
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </li>
                      </>
                    )}

                    {/* Expertise (for evaluators) */}
                    {user?.role === "evaluator" && profileData?.expertise && (
                      <>
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li className="px-3 py-1">
                          <div className="small text-muted mb-1">
                            <i className="bi bi-mortarboard me-1"></i>
                            Expertise
                          </div>
                          <div
                            className="small text-dark"
                            style={{ maxHeight: "60px", overflowY: "auto" }}
                          >
                            {profileData.expertise}
                          </div>
                        </li>
                      </>
                    )}

                    {/* Member Since */}
                    {profileData?.createdAt && (
                      <>
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li className="px-3 py-1">
                          <div className="small text-muted">
                            <i className="bi bi-calendar-check me-1"></i>
                            Member since{" "}
                            {new Date(profileData.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                              }
                            )}
                          </div>
                        </li>
                      </>
                    )}

                    <li>
                      <hr className="dropdown-divider" />
                    </li>

                    {/* Action Buttons */}
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/change-password"
                        onClick={handleNavClick}
                      >
                        <i className="bi bi-key me-2"></i>
                        Change Password
                      </Link>
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link px-3 py-2"
                    to="/login"
                    onClick={handleNavClick}
                  >
                    <i className="bi bi-box-arrow-in-right me-1 d-lg-none"></i>
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link btn btn-light text-primary fw-bold px-3 py-2 mt-2 mt-lg-0 ms-lg-2"
                    to="/register"
                    onClick={handleNavClick}
                  >
                    <i className="bi bi-person-plus me-1"></i>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
