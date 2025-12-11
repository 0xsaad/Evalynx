import { useState, useEffect } from "react";
import api from "../../services/api";

const SubmissionForm = ({ onSubmissionUpdate }) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      const response = await api.get("/team/submission");
      const submissionData =
        response.data.data?.submission || response.data.submission;
      if (submissionData) {
        setExistingSubmission(submissionData);
        setVideoUrl(submissionData.videoUrl);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Error fetching submission:", err);
      }
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    if (!validateUrl(videoUrl)) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/team/submission", { videoUrl });
      const submissionData =
        response.data.data?.submission || response.data.submission;
      setExistingSubmission(submissionData);
      setSuccess(
        existingSubmission
          ? "Submission updated successfully!"
          : "Submission created successfully!"
      );

      if (onSubmissionUpdate) {
        onSubmissionUpdate(submissionData);
      }
    } catch (err) {
      setError(err.message || "Failed to submit video URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          {existingSubmission ? "Update Video Submission" : "Submit Video"}
        </h5>
      </div>
      <div className="card-body">
        {error && (
          <div
            className="alert alert-danger alert-dismissible fade show"
            role="alert"
          >
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError("")}
              aria-label="Close"
            ></button>
          </div>
        )}

        {success && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess("")}
              aria-label="Close"
            ></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="videoUrl" className="form-label">
              Video URL
            </label>
            <input
              type="text"
              className="form-control"
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={loading}
            />
            <div className="form-text">
              Enter the URL of your video submission (YouTube, Vimeo, etc.)
            </div>
          </div>

          {existingSubmission && (
            <div className="mb-3">
              <small className="text-muted">
                Last submitted:{" "}
                {new Date(existingSubmission.submittedAt).toLocaleString()}
                {existingSubmission.updatedAt &&
                  existingSubmission.updatedAt !==
                    existingSubmission.submittedAt && (
                    <>
                      {" "}
                      (Updated:{" "}
                      {new Date(existingSubmission.updatedAt).toLocaleString()})
                    </>
                  )}
              </small>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                {existingSubmission ? "Updating..." : "Submitting..."}
              </>
            ) : (
              <>{existingSubmission ? "Update Submission" : "Submit Video"}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmissionForm;
