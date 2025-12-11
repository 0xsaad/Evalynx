import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState("team");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    teamMembers: [""],
    expertise: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      teamMembers: [""],
      expertise: "",
    });
    setErrors({});
    setApiError("");
  };

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

  const changeTeamMember = (index, value) => {
    const newTeamMembers = [...formData.teamMembers];
    newTeamMembers[index] = value;
    setFormData((prev) => ({
      ...prev,
      teamMembers: newTeamMembers,
    }));
    if (errors.teamMembers) {
      setErrors((prev) => ({
        ...prev,
        teamMembers: "",
      }));
    }
  };

  const addTeamMember = () => {
    if (formData.teamMembers.length < 5) {
      setFormData((prev) => ({
        ...prev,
        teamMembers: [...prev.teamMembers, ""],
      }));
    }
  };

  const removeTeamMember = (index) => {
    if (formData.teamMembers.length > 1) {
      const newTeamMembers = formData.teamMembers.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        teamMembers: newTeamMembers,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must contain uppercase, lowercase, number, and special character";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (role === "team") {
      const validMembers = formData.teamMembers.filter(
        (member) => member.trim() !== ""
      );
      if (validMembers.length < 1) {
        newErrors.teamMembers = "At least one team member is required";
      } else if (validMembers.length > 5) {
        newErrors.teamMembers = "Maximum 5 team members allowed";
      }
    } else if (role === "evaluator") {
      if (!formData.expertise.trim()) {
        newErrors.expertise = "Expertise area is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        role,
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      if (role === "team") {
        requestData.teamMembers = formData.teamMembers
          .filter((member) => member.trim() !== "")
          .map((member) => member.trim());
      } else if (role === "evaluator") {
        requestData.expertise = formData.expertise.trim();
      }

      const response = await api.post("/auth/register", requestData);

      if (response.data.success) {
        setSuccessMessage(response.data.message);

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setApiError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">
                Register for EvalynX
              </h2>

              {apiError && (
                <div className="alert alert-danger" role="alert">
                  {apiError}
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                  <br />
                  <small>Redirecting to login page...</small>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Role Selection */}
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">
                    Register as <span className="text-danger">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="form-select"
                    value={role}
                    onChange={handleRoleChange}
                    disabled={loading}
                  >
                    <option value="team">Team</option>
                    <option value="evaluator">Evaluator</option>
                  </select>
                  <small className="form-text text-muted">
                    {role === "team"
                      ? "Teams can submit videos and view scores"
                      : "Evaluators assess team submissions (requires admin approval)"}
                  </small>
                </div>

                {/* Name */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    {role === "team" ? "Team Name" : "Full Name"}{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-control ${
                      errors.name ? "is-invalid" : ""
                    }`}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={
                      role === "team"
                        ? "Enter team name"
                        : "Enter your full name"
                    }
                    disabled={loading}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-control ${
                      errors.email ? "is-invalid" : ""
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    disabled={loading}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`form-control ${
                      errors.password ? "is-invalid" : ""
                    }`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    disabled={loading}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                  <small className="form-text text-muted">
                    Min 8 characters with uppercase, lowercase, number, and
                    special character
                  </small>
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-control ${
                      errors.confirmPassword ? "is-invalid" : ""
                    }`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>

                {/* Team-specific fields */}
                {role === "team" && (
                  <div className="mb-3">
                    <label className="form-label">
                      Team Members (1-5) <span className="text-danger">*</span>
                    </label>
                    {formData.teamMembers.map((member, index) => (
                      <div key={index} className="input-group mb-2">
                        <input
                          type="text"
                          className={`form-control ${
                            errors.teamMembers ? "is-invalid" : ""
                          }`}
                          value={member}
                          onChange={(e) =>
                            changeTeamMember(index, e.target.value)
                          }
                          placeholder={`Member ${index + 1} name${
                            index === 0 ? " (Team Lead)" : ""
                          }`}
                          disabled={loading}
                        />
                        {formData.teamMembers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeTeamMember(index)}
                            disabled={loading}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {errors.teamMembers && (
                      <div className="text-danger small">
                        {errors.teamMembers}
                      </div>
                    )}
                    {formData.teamMembers.length < 5 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={addTeamMember}
                        disabled={loading}
                      >
                        + Add Team Member
                      </button>
                    )}
                  </div>
                )}

                {/* Evaluator-specific fields */}
                {role === "evaluator" && (
                  <div className="mb-3">
                    <label htmlFor="expertise" className="form-label">
                      Expertise Area <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="expertise"
                      name="expertise"
                      className={`form-control ${
                        errors.expertise ? "is-invalid" : ""
                      }`}
                      value={formData.expertise}
                      onChange={handleChange}
                      placeholder="Describe your area of expertise (e.g., Computer Science, Educational Technology, etc.)"
                      rows="3"
                      disabled={loading}
                    />
                    {errors.expertise && (
                      <div className="invalid-feedback">{errors.expertise}</div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="d-grid gap-2 mb-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || successMessage}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Registering...
                      </>
                    ) : (
                      "Register"
                    )}
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center">
                  <p className="mb-0">
                    Already have an account?{" "}
                    <Link to="/login" className="text-decoration-none">
                      Login here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
