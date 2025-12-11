import { Link } from "react-router-dom";
import logo from "../images/logo-Photoroom-highres.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-light py-4 mt-5">
      <div className="container">
        <div className="row g-4">
          <div className="col-12 col-md-4 text-center text-md-start">
            <h5 className="fw-bold d-flex align-items-center justify-content-center justify-content-md-start">
              <img 
                src={logo} 
                alt="EvalynX Logo" 
                style={{ height: '30px', width: 'auto' }}
              />
            </h5>
            <p className="text-white small mb-0">
              Automated Content Submission Evaluation System for Computer
              Science Competitions
            </p>
          </div>

          <div className="col-6 col-md-4 text-center text-md-start">
            <h6 className="fw-bold mb-3">Quick Links:</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-2">
                <Link
                  to="/"
                  className="text-light text-decoration-none small d-inline-flex align-items-center"
                >
                  <i className="bi bi-house me-2"></i>
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/leaderboard"
                  className="text-light text-decoration-none small d-inline-flex align-items-center"
                >
                  <i className="bi bi-trophy me-2"></i>
                  Leaderboard
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/login"
                  className="text-light text-decoration-none small d-inline-flex align-items-center"
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/register"
                  className="text-light text-decoration-none small d-inline-flex align-items-center"
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Register
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-6 col-md-4 text-center text-md-start">
            <h6 className="fw-bold mb-3">Contact Info:</h6>
            <ul className="list-unstyled small mb-0">
              <li className="mb-2 d-inline-flex align-items-center">
                <i className="bi bi-envelope me-2"></i>
                <span className="text-white">info@example.com</span>
              </li>
              <br />
              <li className="mb-2 d-inline-flex align-items-center">
                <i className="bi bi-telephone me-2"></i>
                <span className="text-white">(000) 000-0000</span>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-3 bg-secondary opacity-25" />

        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-0 small text-white">
              &copy; {currentYear} EvalynX. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
