import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import competitionImage from "../images/competition.png";

const Home = () => {
  const [competitionInfo, setCompetitionInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompetitionInfo();
  }, []);

  const fetchCompetitionInfo = async () => {
    try {
      const response = await api.get("/public/competition-info");
      setCompetitionInfo(response.data);
    } catch (error) {
      console.error("Error fetching competition info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const criteria = competitionInfo?.criteria || [
    { name: "Relevance to Learning Outcomes", weightage: 5 },
    { name: "Innovation & Creativity", weightage: 15 },
    { name: "Clarity & Accessibility", weightage: 10 },
    { name: "Depth", weightage: 5 },
    { name: "Interactivity & Engagement", weightage: 25 },
    { name: "Use of Technology", weightage: 5 },
    { name: "Scalability & Adaptability", weightage: 10 },
    { name: "Alignment with Ethical Standards", weightage: 5 },
    { name: "Practical Application", weightage: 10 },
    { name: "Video Quality", weightage: 10 },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 text-center text-lg-start">
              <h1 className="display-4 fw-bold mb-3">
                {competitionInfo?.title || "EvalynX Evaluation System"}
              </h1>
              <p className="lead mb-4">
                {competitionInfo?.description ||
                  "An automated content submission evaluation system for computer science competitions. Submit your video content, receive expert evaluations, and compete for the top spot on our leaderboard."}
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                <Link to="/register" className="btn btn-light btn-lg">
                  <i className="bi bi-person-plus me-2"></i>
                  Register Now
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </Link>
              </div>
            </div>
            <div className="col-lg-4 text-center mt-4 mt-lg-0 d-none d-lg-block">
              <img 
                src={competitionImage} 
                alt="Competition" 
                className="img-fluid"
                style={{ maxHeight: '300px', width: 'auto' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Evaluation Criteria Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4">Evaluation Criteria</h2>
          <p className="text-center text-muted mb-5">
            Your submission will be evaluated by 3 expert evaluators based on
            the following criteria (Total: 100 marks)
          </p>
          <div className="row g-4">
            {criteria.map((criterion, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{criterion.name}</h5>
                      <span className="badge bg-primary rounded-pill">
                        {criterion.weightage}%
                      </span>
                    </div>
                    <p className="card-text text-muted small">
                      {criterion.description ||
                        `Evaluated based on ${criterion.name.toLowerCase()}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competition Rules Section */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mb-4">
              <h2 className="mb-4">Competition Rules</h2>
              <ul className="list-group list-group-flush">
                {competitionInfo?.rules ? (
                  competitionInfo.rules.map((rule, index) => (
                    <li key={index} className="list-group-item">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      {rule}
                    </li>
                  ))
                ) : (
                  <>
                    <li className="list-group-item">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Teams must register with valid information
                    </li>
                    <li className="list-group-item">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Submit a video URL showcasing your project
                    </li>
                    <li className="list-group-item">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Each team will be evaluated by 3 approved evaluators
                    </li>
                    <li className="list-group-item">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Final score is the average of all 3 evaluations
                    </li>
                    <li className="list-group-item">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Results will be published on the leaderboard
                    </li>
                    <li className="list-group-item">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Teams can update submissions before the deadline
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div className="col-lg-6 mb-4">
              <h2 className="mb-4">Competition Timeline</h2>
              <div className="timeline">
                {competitionInfo?.timeline ? (
                  competitionInfo.timeline.map((event, index) => (
                    <div key={index} className="mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            {event.date}
                          </h6>
                          <p className="card-text">{event.event}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            Phase 1
                          </h6>
                          <p className="card-text">
                            Team Registration & Evaluator Approval
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            Phase 2
                          </h6>
                          <p className="card-text">Video Submission Period</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            Phase 3
                          </h6>
                          <p className="card-text">Evaluation Period</p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="card">
                        <div className="card-body">
                          <h6 className="card-subtitle mb-2 text-muted">
                            Phase 4
                          </h6>
                          <p className="card-text">Results Publication</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-5 bg-primary text-white">
        <div className="container text-center">
          <h2 className="mb-3">Ready to Participate?</h2>
          <p className="lead mb-4">
            Join the competition today and showcase your innovative content!
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <Link to="/register" className="btn btn-light btn-lg">
              <i className="bi bi-person-plus me-2"></i>
              Register as Team
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Information Section */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-4">Contact Us</h2>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-md-4 mb-3 mb-md-0">
                      <i
                        className="bi bi-envelope-fill text-primary"
                        style={{ fontSize: "2rem" }}
                      ></i>
                      <h5 className="mt-2">Email</h5>
                      <p className="text-muted">
                        {competitionInfo?.contact?.email ||
                          "support@evalynx.com"}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3 mb-md-0">
                      <i
                        className="bi bi-telephone-fill text-primary"
                        style={{ fontSize: "2rem" }}
                      ></i>
                      <h5 className="mt-2">Phone</h5>
                      <p className="text-muted">
                        {competitionInfo?.contact?.phone || "+1 (555) 123-4567"}
                      </p>
                    </div>
                    <div className="col-md-4">
                      <i
                        className="bi bi-geo-alt-fill text-primary"
                        style={{ fontSize: "2rem" }}
                      ></i>
                      <h5 className="mt-2">Address</h5>
                      <p className="text-muted">
                        {competitionInfo?.contact?.address ||
                          "Computer Science Department"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
