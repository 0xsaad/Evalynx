import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

import Home from "./components/public/Home";
import Leaderboard from "./components/public/Leaderboard";

import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import PasswordChange from "./components/auth/PasswordChange";

import TeamDashboard from "./components/team/TeamDashboard";
import EvaluatorDashboard from "./components/evaluator/EvaluatorDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";

import FeedbackView from "./components/team/FeedbackView";

import AssignedTeams from "./components/evaluator/AssignedTeams";
import EvaluationForm from "./components/evaluator/EvaluationForm";

import EvaluatorApproval from "./components/admin/EvaluatorApproval";
import AssignmentManager from "./components/admin/AssignmentManager";
import ResultPublisher from "./components/admin/ResultPublisher";
import UserManagement from "./components/admin/UserManagement";
import SupportDashboard from "./components/admin/SupportDashboard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/change-password"
                element={
                  <ProtectedRoute allowedRoles={["team", "evaluator", "admin"]}>
                    <PasswordChange />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/team/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["team"]}>
                    <TeamDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team/feedback"
                element={
                  <ProtectedRoute allowedRoles={["team"]}>
                    <FeedbackView />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/evaluator/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["evaluator"]}>
                    <EvaluatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluator/assignments"
                element={
                  <ProtectedRoute allowedRoles={["evaluator"]}>
                    <AssignedTeams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/evaluator/evaluate/:teamId"
                element={
                  <ProtectedRoute allowedRoles={["evaluator"]}>
                    <EvaluationForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/evaluator-approval"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <EvaluatorApproval />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assignments"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AssignmentManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/publish-results"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ResultPublisher />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SupportDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
