import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// ─── Google Fonts (Sora + DM Mono) ───────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// Reset base styles
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080d14; }
  input, textarea, button, select { font-family: inherit; }
  input:focus, textarea:focus { border-color: rgba(20,184,166,0.5) !important; box-shadow: 0 0 0 2px rgba(20,184,166,0.1); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
`;
document.head.appendChild(style);

// ─── Protected route wrapper ──────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ─── Role-based home redirect ─────────────────────────────────────────────────
function HomeRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === "DOCTOR") return <Navigate to="/doctor" replace />;
  if (user?.role === "PATIENT") return <Navigate to="/patient" replace />;
  if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

function Spinner() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#080d14",
      color: "#14b8a6",
      fontSize: "24px",
      fontFamily: "'Sora', sans-serif",
    }}>
      ⬡
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Doctor */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={["DOCTOR"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Patient */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={["PATIENT"]}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all → redirect based on role */}
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
