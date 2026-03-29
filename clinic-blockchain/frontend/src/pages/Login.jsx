import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data.token, data.user);
      // Redirect based on role
      const role = data.user.role;
      if (role === "DOCTOR") navigate("/doctor");
      else if (role === "PATIENT") navigate("/patient");
      else if (role === "ADMIN") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Background grid */}
      <div style={s.grid} />

      <div style={s.card}>
        {/* Logo / brand */}
        <div style={s.brand}>
          <div style={s.logo}>⬡</div>
          <div>
            <p style={s.logoTitle}>ClinicChain</p>
            <p style={s.logoSub}>Secure Medical Records</p>
          </div>
        </div>

        <h1 style={s.heading}>Sign in</h1>
        <p style={s.sub}>Access your medical data, secured on-chain.</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@clinic.com"
              required
              style={s.input}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={s.input}
            />
          </div>

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p style={s.footer}>
          No account?{" "}
          <Link to="/register" style={s.link}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "#080d14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Sora', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(20,184,166,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.06) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(13,20,30,0.95)",
    border: "1px solid rgba(20,184,166,0.2)",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 0 60px rgba(20,184,166,0.08), 0 20px 40px rgba(0,0,0,0.6)",
    backdropFilter: "blur(12px)",
    zIndex: 1,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "28px",
  },
  logo: {
    fontSize: "32px",
    color: "#14b8a6",
    lineHeight: 1,
  },
  logoTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 700,
    color: "#e2e8f0",
    letterSpacing: "0.03em",
  },
  logoSub: {
    margin: 0,
    fontSize: "11px",
    color: "#475569",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  heading: {
    margin: "0 0 6px",
    fontSize: "28px",
    fontWeight: 800,
    color: "#f1f5f9",
    letterSpacing: "-0.02em",
  },
  sub: {
    margin: "0 0 24px",
    fontSize: "14px",
    color: "#64748b",
  },
  errorBox: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#fca5a5",
    marginBottom: "16px",
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "12px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "11px 14px",
    fontSize: "14px",
    color: "#e2e8f0",
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'Sora', sans-serif",
  },
  btn: {
    marginTop: "8px",
    padding: "13px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #14b8a6, #0891b2)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Sora', sans-serif",
    letterSpacing: "0.02em",
    transition: "opacity 0.2s",
  },
  footer: { marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#475569" },
  link: { color: "#14b8a6", textDecoration: "none", fontWeight: 600 },
};
