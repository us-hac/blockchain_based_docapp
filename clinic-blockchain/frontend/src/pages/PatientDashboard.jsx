import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import BlockchainBadge from "../components/BlockchainBadge";

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const [records, setRecords]           = useState([]);
  const [permissions, setPermissions]   = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [tab, setTab]                   = useState("records");
  const [revoking, setRevoking]         = useState(null);

  // ── Book appointment form state ──────────────────────────────
  const [showBookForm, setShowBookForm] = useState(false);
  const [booking, setBooking]           = useState(false);
  const [bookForm, setBookForm]         = useState({
    doctorId: "",
    scheduledAt: "",
    notes: "",
  });

  const load = useCallback(async () => {
    try {
  const [recRes, permRes, apptRes, docRes] = await Promise.allSettled([
  api.get("/records/mine"),
  api.get("/access-permissions/mine"),
  api.get("/appointments/mine"),
  api.get("/appointments/doctors"),
]);
if (recRes.status  === "fulfilled") setRecords(recRes.value.data);
if (permRes.status === "fulfilled") setPermissions(permRes.value.data);
if (apptRes.status === "fulfilled") setAppointments(apptRes.value.data);
if (docRes.status  === "fulfilled") setDoctors(docRes.value.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const revokeAccess = async (doctorId) => {
    setRevoking(doctorId);
    try {
      await api.post("/access-permissions/revoke", { doctorId });
      setPermissions((prev) => prev.filter((p) => p.doctor_id !== doctorId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to revoke access.");
    } finally {
      setRevoking(null);
    }
  };

  const handleBook = async () => {
    if (!bookForm.doctorId || !bookForm.scheduledAt) {
      alert("Please select a doctor and date/time.");
      return;
    }
    setBooking(true);
    try {
      const res = await api.post("/appointments", bookForm);
      setAppointments((prev) => [res.data, ...prev]);
      setShowBookForm(false);
      setBookForm({ doctorId: "", scheduledAt: "", notes: "" });
      setTab("appointments");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to book appointment.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logo}>⬡</div>
          <p style={s.logoTitle}>ClinicChain</p>
        </div>
        <nav style={s.nav}>
          <button onClick={() => setTab("records")} style={s.navBtn(tab === "records")}>
            📋 My Records
          </button>
          <button onClick={() => setTab("access")} style={s.navBtn(tab === "access")}>
            🔑 Access Control
          </button>
          <button onClick={() => setTab("appointments")} style={s.navBtn(tab === "appointments")}>
            📅 Appointments
          </button>
        </nav>
        <div style={s.sideFooter}>
          <p style={s.userName}>{user?.name}</p>
          <p style={s.userRole}>Patient</p>
          <button onClick={logout} style={s.logoutBtn}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>

        {/* ── Records tab ─────────────────────────────────── */}
        {tab === "records" && (
          <section>
            <h2 style={s.sectionTitle}>My Medical Records</h2>
            <p style={s.sectionSub}>Every record below is cryptographically anchored to the blockchain.</p>
            {records.length === 0 && <p style={s.empty}>No medical records yet.</p>}
            <div style={s.list}>
              {records.map((r) => (
                <div key={r.record_id} style={s.recordCard}>
                  <div style={s.recordTop}>
                    <div>
                      <p style={s.recordDate}>{new Date(r.created_at).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
                      <p style={s.recordDoctor}>Dr. {r.doctor_name || "—"} · {r.doctor_specialization || ""}</p>
                    </div>
                    <BlockchainBadge txHash={r.tx_hash} recordId={r.record_id} />
                  </div>
                  <div style={s.recordBody}>
                    <div style={s.fieldGroup}>
                      <span style={s.fieldLabel}>Diagnosis</span>
                      <p style={s.fieldValue}>{r.diagnosis}</p>
                    </div>
                    <div style={s.fieldGroup}>
                      <span style={s.fieldLabel}>Prescription</span>
                      <p style={s.fieldValue}>{r.prescription}</p>
                    </div>
                  </div>
                  {r.data_hash && (
                    <p style={s.hashLine}>
                      SHA-256: <span style={s.hashValue}>{r.data_hash}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Access Control tab ───────────────────────────── */}
        {tab === "access" && (
          <section>
            <h2 style={s.sectionTitle}>Access Control</h2>
            <p style={s.sectionSub}>
              These doctors currently have permission to view your records.
              Revoke at any time — the change is written to the blockchain.
            </p>
            {permissions.length === 0 && (
              <div style={s.emptyAccess}>
                <span style={{ fontSize: "32px" }}>🔒</span>
                <p>No doctors have access to your records right now.</p>
              </div>
            )}
            <div style={s.list}>
              {permissions.map((p) => (
                <div key={p.permission_id} style={s.permCard}>
                  <div style={s.permAvatar}>{p.doctor_name?.[0] ?? "D"}</div>
                  <div style={{ flex: 1 }}>
                    <p style={s.patientName}>Dr. {p.doctor_name}</p>
                    <p style={s.patientSub}>
                      {p.specialization || "—"} · Granted {new Date(p.granted_at).toLocaleDateString()}
                    </p>
                    {p.tx_hash && (
                      <p style={s.permHash}>
                        Proof: <span style={s.hashValue}>{p.tx_hash.slice(0, 14)}…</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => revokeAccess(p.doctor_id)}
                    disabled={revoking === p.doctor_id}
                    style={s.revokeBtn}
                  >
                    {revoking === p.doctor_id ? "Revoking…" : "Revoke access"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Appointments tab ────────────────────────────── */}
        {tab === "appointments" && (
          <section>
            <div style={s.apptHeader}>
              <div>
                <h2 style={s.sectionTitle}>My Appointments</h2>
                <p style={s.sectionSub}>Book and track your visits with doctors.</p>
              </div>
              <button onClick={() => setShowBookForm(true)} style={s.bookBtn}>
                + Book Appointment
              </button>
            </div>

            {/* ── Book form modal ── */}
            {showBookForm && (
              <div style={s.modalOverlay}>
                <div style={s.modal}>
                  <h3 style={s.modalTitle}>Book an Appointment</h3>

                  <label style={s.label}>Select Doctor</label>
                  <select
                    style={s.input}
                    value={bookForm.doctorId}
                    onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}
                  >
                    <option value="">— Choose a doctor —</option>
                    {doctors.map((d) => (
                      <option key={d.doctor_id} value={d.doctor_id}>
                        Dr. {d.name} — {d.specialization || d.department || "General"}
                      </option>
                    ))}
                  </select>

                  <label style={s.label}>Date & Time</label>
                  <input
                    type="datetime-local"
                    style={s.input}
                    value={bookForm.scheduledAt}
                    onChange={(e) => setBookForm({ ...bookForm, scheduledAt: e.target.value })}
                  />

                  <label style={s.label}>Notes (optional)</label>
                  <textarea
                    style={{ ...s.input, height: "72px", resize: "vertical" }}
                    placeholder="Describe your symptoms or reason for visit…"
                    value={bookForm.notes}
                    onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                  />

                  <div style={s.modalActions}>
                    <button
                      onClick={() => { setShowBookForm(false); setBookForm({ doctorId: "", scheduledAt: "", notes: "" }); }}
                      style={s.cancelBtn}
                    >
                      Cancel
                    </button>
                    <button onClick={handleBook} disabled={booking} style={s.confirmBtn}>
                      {booking ? "Booking…" : "Confirm Booking"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {appointments.length === 0 && !showBookForm && (
              <div style={s.emptyAccess}>
                <span style={{ fontSize: "32px" }}>📅</span>
                <p>No appointments yet. Click "Book Appointment" to get started.</p>
              </div>
            )}

            <div style={s.list}>
              {appointments.map((a) => (
                <div key={a.appointment_id} style={s.apptCard}>
                  <div style={{ flex: 1 }}>
                    <p style={s.patientName}>Dr. {a.doctor_name || "—"}</p>
                    <p style={s.patientSub}>
                      {a.specialization && <span>{a.specialization} · </span>}
                      {new Date(a.scheduled_at).toLocaleString("en-IN")}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </p>
                  </div>
                  <StatusPill status={a.status} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    PENDING:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
    CONFIRMED: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)" },
    DONE:      { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)" },
    CANCELLED: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)" },
  };
  const t = map[status] || { color: "#64748b", bg: "transparent", border: "rgba(100,116,139,0.25)" };
  return (
    <span style={{
      padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
      color: t.color, background: t.bg, border: `1px solid ${t.border}`,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {status}
    </span>
  );
}

const s = {
  page: { display: "flex", minHeight: "100vh", background: "#080d14", fontFamily: "'Sora', sans-serif", color: "#e2e8f0" },
  sidebar: { width: "220px", flexShrink: 0, background: "rgba(13,20,30,0.98)", borderRight: "1px solid rgba(20,184,166,0.12)", display: "flex", flexDirection: "column", padding: "24px 16px" },
  sideTop: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" },
  logo: { fontSize: "24px", color: "#14b8a6" },
  logoTitle: { margin: 0, fontSize: "14px", fontWeight: 700, color: "#e2e8f0" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: (active) => ({ padding: "10px 14px", borderRadius: "8px", border: "none", background: active ? "rgba(20,184,166,0.15)" : "transparent", color: active ? "#14b8a6" : "#64748b", cursor: "pointer", fontSize: "14px", fontWeight: 600, textAlign: "left", fontFamily: "'Sora', sans-serif" }),
  sideFooter: { borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" },
  userName: { margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: "#e2e8f0" },
  userRole: { margin: "0 0 12px", fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" },
  logoutBtn: { padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.25)", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px", fontFamily: "'Sora', sans-serif", width: "100%" },
  main: { flex: 1, padding: "32px", overflowY: "auto", maxWidth: "860px" },
  sectionTitle: { margin: "0 0 6px", fontSize: "22px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" },
  sectionSub: { margin: "0 0 24px", fontSize: "13px", color: "#475569" },
  empty: { color: "#475569", fontSize: "14px" },
  emptyAccess: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "40px", color: "#64748b", fontSize: "14px", textAlign: "center" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  recordCard: { padding: "18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" },
  recordTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "14px" },
  recordDate: { margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: "#e2e8f0" },
  recordDoctor: { margin: 0, fontSize: "12px", color: "#64748b" },
  recordBody: { display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "10px" },
  fieldGroup: { flex: 1, minWidth: "160px" },
  fieldLabel: { display: "block", fontSize: "10px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" },
  fieldValue: { margin: 0, fontSize: "14px", color: "#cbd5e1", lineHeight: 1.5 },
  hashLine: { margin: "8px 0 0", fontSize: "11px", color: "#475569", fontFamily: "'DM Mono', monospace" },
  hashValue: { color: "#334155", wordBreak: "break-all" },
  permCard: { display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", flexWrap: "wrap" },
  permAvatar: { width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #0891b2, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "15px", color: "#fff", flexShrink: 0 },
  patientName: { margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "#e2e8f0" },
  patientSub: { margin: 0, fontSize: "12px", color: "#64748b" },
  permHash: { margin: "4px 0 0", fontSize: "11px", color: "#475569", fontFamily: "'DM Mono', monospace" },
  revokeBtn: { padding: "7px 14px", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", cursor: "pointer", fontSize: "12px", fontWeight: 600, fontFamily: "'Sora', sans-serif" },
  // Appointments
  apptHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0px", flexWrap: "wrap", gap: "12px" },
  bookBtn: { padding: "10px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #14b8a6, #0891b2)", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "'Sora', sans-serif" },
  apptCard: { display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", flexWrap: "wrap" },
  // Modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal: { background: "#0d141e", border: "1px solid rgba(20,184,166,0.2)", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "440px", display: "flex", flexDirection: "column", gap: "10px" },
  modalTitle: { margin: "0 0 6px", fontSize: "18px", fontWeight: 800, color: "#f1f5f9" },
  label: { fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" },
  input: { padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: "14px", fontFamily: "'Sora', sans-serif", outline: "none", width: "100%", boxSizing: "border-box" },
  modalActions: { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "6px" },
  cancelBtn: { padding: "9px 18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: "13px", fontFamily: "'Sora', sans-serif" },
  confirmBtn: { padding: "9px 18px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #14b8a6, #0891b2)", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "'Sora', sans-serif" },
};
