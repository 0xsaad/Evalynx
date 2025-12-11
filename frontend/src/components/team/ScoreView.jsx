import { useState, useEffect } from "react";
import api from "../../services/api";

const ScoreView = () => {
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const criteria = [
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

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const response = await api.get("/team/scores");
      setScores(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("No evaluations available yet");
      } else {
        setError(err.message || "Failed to fetch scores");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading scores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Evaluation Scores</h5>
        </div>
        <div className="card-body">
          <div className="alert alert-info" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            {error}
          </div>
          <p className="text-muted">
            Your submission is pending evaluation. Scores will appear here once
            evaluators have completed their assessments.
          </p>
        </div>
      </div>
    );
  }

  const { evaluations, averageScore, breakdown } = scores;

  const isComplete = evaluations && evaluations.length === 3;

  return (
    <>
      {/* Evaluation Scores Card */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Evaluation Scores</h5>
          {isComplete ? (
            <span className="badge bg-success">Complete</span>
          ) : (
            <span className="badge bg-warning text-dark">
              Pending ({evaluations?.length || 0}/3 evaluations)
            </span>
          )}
        </div>
        <div className="card-body">
          {!isComplete && (
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-clock me-2"></i>
              Evaluations in progress. {evaluations?.length || 0} out of 3
              evaluators have submitted their scores.
            </div>
          )}

          {averageScore !== null && averageScore !== undefined && (
            <div className="text-center mb-4 p-3 bg-light rounded">
              <h3 className="mb-1">Average Score</h3>
              <h1 className="display-4 text-primary mb-0">
                {averageScore.toFixed(2)}/100
              </h1>
            </div>
          )}

          {/* Comments section */}
          {evaluations && evaluations.length > 0 && (
            <div className="mt-4">
              <h6 className="mb-3">Evaluator Comments</h6>
              {evaluations.map((evaluation, evalIdx) => (
                <div key={evalIdx} className="mb-4">
                  <h6 className="text-primary">Evaluator {evalIdx + 1}</h6>
                  <div className="accordion" id={`accordion-${evalIdx}`}>
                    {criteria.map((criterion, critIdx) => {
                      const comment = evaluation.scores[criterion.key]?.comment;
                      if (!comment) return null;

                      return (
                        <div className="accordion-item" key={critIdx}>
                          <h2
                            className="accordion-header"
                            id={`heading-${evalIdx}-${critIdx}`}
                          >
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#collapse-${evalIdx}-${critIdx}`}
                              aria-expanded="false"
                              aria-controls={`collapse-${evalIdx}-${critIdx}`}
                            >
                              {criterion.label}
                            </button>
                          </h2>
                          <div
                            id={`collapse-${evalIdx}-${critIdx}`}
                            className="accordion-collapse collapse"
                            aria-labelledby={`heading-${evalIdx}-${critIdx}`}
                            data-bs-parent={`#accordion-${evalIdx}`}
                          >
                            <div className="accordion-body">{comment}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scores by Criteria Card */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Scores by Criteria</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Criterion</th>
                  <th className="text-center">Weightage</th>
                  {evaluations?.map((evaluation, idx) => (
                    <th key={idx} className="text-center">
                      Evaluator {idx + 1}
                    </th>
                  ))}
                  {breakdown && <th className="text-center">Average</th>}
                </tr>
              </thead>
              <tbody>
                {criteria.map((criterion) => (
                  <tr key={criterion.key}>
                    <td>{criterion.label}</td>
                    <td className="text-center">{criterion.weightage}</td>
                    {evaluations?.map((evaluation, idx) => (
                      <td key={idx} className="text-center">
                        {evaluation.scores[criterion.key]?.score || 0}
                      </td>
                    ))}
                    {breakdown && (
                      <td className="text-center fw-bold">
                        {breakdown[criterion.key]?.toFixed(2) || "0.00"}
                      </td>
                    )}
                  </tr>
                ))}
                <tr className="table-secondary fw-bold">
                  <td>Total Score</td>
                  <td className="text-center">100</td>
                  {evaluations?.map((evaluation, idx) => (
                    <td key={idx} className="text-center">
                      {evaluation.totalScore}
                    </td>
                  ))}
                  {averageScore !== null && averageScore !== undefined && (
                    <td className="text-center">{averageScore.toFixed(2)}</td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScoreView;
