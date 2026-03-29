import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const ROLES = ["PATIENT", "DOCTOR"];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "PATIENT",
    // Doctor-specific
    specialization: "",
    licenseNo: "",
    department: "",
    // Patient-specific
    dateOfBirth: "",
    bloodType: "",
    contactInfo: "",
    insuranceNo: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.grid} />
      <div style={s.card}>
        <div style={s.brand}>
          <span style={s.logo}>⬡</span>
          <span style={s.logoTitle}>ClinicChain — Register</span>
        </div>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          {/* Role selector */}
          <div style={s.roleRow}>
            {ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setForm((p) => ({ ...p, role: r }))}
                style={s.roleBtn(form.role === r)}
              >
                {r === "PATIENT" ? "🧑‍⚕️ Patient" : "👨‍⚕️ Doctor"}
              </button>
            ))}
          </div>

          {/* Common fields */}
          <Field label="Full Name" name="name" value={form.name} onChange={set} placeholder="Dr. Ramesh Kumar" required />
          <Field label="Email" name="email" type="email" value={form.email} onChange={set} placeholder="you@clinic.com" required />
          <Field label="Password" name="password" type="password" value={form.password} onChange={set} placeholder="Min 8 characters" required />

          {/* Doctor fields */}
          {form.role === "DOCTOR" && (
            <>
              <div style={s.divider}>Doctor Details</div>
              <Field label="Specialization" name="specialization" value={form.specialization} onChange={set} placeholder="Cardiology" required />
              <Field label="License No." name="licenseNo" value={form.licenseNo} onChange={set} placeholder="MCI-2023-XXXX" required />
              <Field label="Department" name="department" value={form.department} onChange={set} placeholder="OPD Block B" />
            </>
          )}

          {/* Patient fields */}
          {form.role === "PATIENT" && (
            <>
              <div style={s.divider}>Patient Details</div>
              <Field label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set} required />
              <Field label="Blood Type" name="bloodType" value={form.bloodType} onChange={set} placeholder="A+" />
              <Field label="Contact / Address" name="contactInfo" value={form.contactInfo} onChange={set} placeholder="Phone, address" />
              <Field label="Insurance No." name="insuranceNo" value={form.insuranceNo} onChange={set} placeholder="Optional" />
            </>
          )}

          <button type="submit" disabled={loading} style={s.btn}>
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account?{" "}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder = "", required = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={s.label}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={s.input}
      />
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#080d14",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'Sora', sans-serif",
    position: "relative",
  },
  grid: {
    position: "fixed",
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
    maxWidth: "440px",
    boxShadow: "0 0 60px rgba(20,184,166,0.08), 0 20px 40px rgba(0,0,0,0.6)",
    zIndex: 1,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  logo: { fontSize: "28px", color: "#14b8a6" },
  logoTitle: { fontSize: "15px", fontWeight: 700, color: "#e2e8f0" },
  errorBox: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#fca5a5",
    marginBottom: "16px",
  },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  roleRow: { display: "flex", gap: "10px" },
  roleBtn: (active) => ({
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: `1px solid ${active ? "#14b8a6" : "rgba(255,255,255,0.08)"}`,
    background: active ? "rgba(20,184,166,0.15)" : "transparent",
    color: active ? "#14b8a6" : "#64748b",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
    fontFamily: "'Sora', sans-serif",
    transition: "all 0.2s",
  }),
  divider: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: "10px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "11px 14px",
    fontSize: "14px",
    color: "#e2e8f0",
    outline: "none",
    fontFamily: "'Sora', sans-serif",
  },
  btn: {
    marginTop: "6px",
    padding: "13px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #14b8a6, #0891b2)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Sora', sans-serif",
  },
  footer: { marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#475569" },
  link: { color: "#14b8a6", textDecoration: "none", fontWeight: 600 },
};
