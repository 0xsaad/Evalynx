import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const PasswordChange = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (apiError) {
      setApiError("");
    }
  };

  const togglePassView = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
        formData.newPassword
      )
    ) {
      newErrors.newPassword =
        "Password must contain uppercase, lowercase, number, and special character";
    }

    if (
      formData.newPassword &&
      formData.currentPassword &&
      formData.newPassword === formData.currentPassword
    ) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        const { token } = response.data;

        const updatedUser = {
          ...user,
          isFirstLogin: false,
        };
        login(token, updatedUser);

        switch (user.role) {
          case "team":
            navigate("/team/dashboard");
            break;
          case "evaluator":
            navigate("/evaluator/dashboard");
            break;
          case "admin":
            navigate("/admin/dashboard");
            break;
          default:
            navigate("/");
        }
      }
    } catch (error) {
      console.error("Password change error:", error);
      setApiError(error.message || "Password change failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-3">Change Password</h2>

              {user?.isFirstLogin && (
                <div className="alert alert-warning" role="alert">
                  <strong>First Login:</strong> You must change your password
                  before continuing.
                </div>
              )}

              {apiError && (
                <div className="alert alert-danger" role="alert">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Current Password */}
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      className={`form-control ${
                        errors.currentPassword ? "is-invalid" : ""
                      }`}
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => togglePassView("current")}
                      disabled={loading}
                    >
                      {showPassword.current ? "👁️" : "👁️‍🗨️"}
                    </button>
                    {errors.currentPassword && (
                      <div className="invalid-feedback">
                        {errors.currentPassword}
                      </div>
                    )}
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    New Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      className={`form-control ${
                        errors.newPassword ? "is-invalid" : ""
                      }`}
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => togglePassView("new")}
                      disabled={loading}
                    >
                      {showPassword.new ? "👁️" : "👁️‍🗨️"}
                    </button>
                    {errors.newPassword && (
                      <div className="invalid-feedback">
                        {errors.newPassword}
                      </div>
                    )}
                  </div>
                  <small className="form-text text-muted">
                    Min 8 characters with uppercase, lowercase, number, and
                    special character
                  </small>
                </div>

                {/* Confirm New Password */}
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm New Password <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      className={`form-control ${
                        errors.confirmPassword ? "is-invalid" : ""
                      }`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => togglePassView("confirm")}
                      disabled={loading}
                    >
                      {showPassword.confirm ? "👁️" : "👁️‍🗨️"}
                    </button>
                    {errors.confirmPassword && (
                      <div className="invalid-feedback">
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="d-grid gap-2 mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Changing Password...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </div>

                {/* Logout Option */}
                {!user?.isFirstLogin && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none"
                      onClick={handleLogout}
                      disabled={loading}
                    >
                      Cancel and Logout
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordChange;
