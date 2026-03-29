import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import BlockchainBadge from "../components/BlockchainBadge";

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ diagnosis: "", prescription: "" });
  const [submitting, setSubmitting] = useState(false);
  const [newRecord, setNewRecord] = useState(null); // latest saved record (shows tx_hash)
  const [tab, setTab] = useState("patients"); // patients | appointments

  // Load all patients accessible to this doctor
  const loadPatients = useCallback(async () => {
    try {
      const { data } = await api.get("/patients");
      setPatients(data);
    } catch (err) {
      console.error("Failed to load patients", err);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const { data } = await api.get("/appointments/doctor");
      setAppointments(data);
    } catch (err) {
      console.error("Failed to load appointments", err);
    }
  }, []);

  useEffect(() => {
    loadPatients();
    loadAppointments();
  }, [loadPatients, loadAppointments]);

  const loadRecords = async (patientId) => {
    try {
      const { data } = await api.get(`/records?patientId=${patientId}`);
      setRecords(data);
    } catch (err) {
      console.error("Failed to load records", err);
    }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setShowForm(false);
    setNewRecord(null);
    loadRecords(patient.patient_id);
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      const { data } = await api.post("/records", {
        patientId: selectedPatient.patient_id,
        diagnosis: form.diagnosis,
        prescription: form.prescription,
      });
      setNewRecord(data);
      setRecords((prev) => [data, ...prev]);
      setForm({ diagnosis: "", prescription: "" });
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.patch(`/appointments/${appointmentId}`, { status });
      setAppointments((prev) =>
        prev.map((a) => (a.appointment_id === appointmentId ? { ...a, status } : a))
      );
    } catch (err) {
      console.error("Failed to update appointment", err);
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
          <button onClick={() => setTab("patients")} style={s.navBtn(tab === "patients")}>
            🧑‍⚕️ Patients
          </button>
          <button onClick={() => setTab("appointments")} style={s.navBtn(tab === "appointments")}>
            📅 Appointments
          </button>
        </nav>

        <div style={s.sideFooter}>
          <p style={s.userName}>{user?.name}</p>
          <p style={s.userRole}>Doctor</p>
          <button onClick={logout} style={s.logoutBtn}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {/* ── Patients tab ─────────────────────────────────── */}
        {tab === "patients" && (
          <div style={s.columns}>
            {/* Patient list */}
            <section style={s.section}>
              <h2 style={s.sectionTitle}>Your Patients</h2>
              {patients.length === 0 && <p style={s.empty}>No patients assigned yet.</p>}
              <div style={s.list}>
                {patients.map((p) => (
                  <div
                    key={p.patient_id}
                    onClick={() => selectPatient(p)}
                    style={s.patientCard(selectedPatient?.patient_id === p.patient_id)}
                  >
                    <div style={s.avatar}>{p.name?.[0] ?? "P"}</div>
                    <div>
                      <p style={s.patientName}>{p.name}</p>
                      <p style={s.patientSub}>
                        {p.blood_type || "—"} · DOB: {p.date_of_birth?.split("T")[0] || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Records panel */}
            {selectedPatient && (
              <section style={s.section}>
                <div style={s.recordsHeader}>
                  <h2 style={s.sectionTitle}>
                    Records — <span style={{ color: "#14b8a6" }}>{selectedPatient.name}</span>
                  </h2>
                  <button onClick={() => setShowForm(true)} style={s.addBtn}>
                    + Add Record
                  </button>
                </div>

                {/* New record success */}
                {newRecord && (
                  <div style={s.successBanner}>
                    <span>✅ Record saved!</span>
                    <BlockchainBadge
                      txHash={newRecord.tx_hash}
                      recordId={newRecord.record_id}
                      verified={true}
                    />
                  </div>
                )}

                {/* Add record form */}
                {showForm && (
                  <form onSubmit={handleAddRecord} style={s.form}>
                    <label style={s.label}>Diagnosis</label>
                    <textarea
                      required
                      rows={3}
                      value={form.diagnosis}
                      onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))}
                      placeholder="Clinical notes…"
                      style={s.textarea}
                    />
                    <label style={s.label}>Prescription</label>
                    <textarea
                      required
                      rows={2}
                      value={form.prescription}
                      onChange={(e) => setForm((p) => ({ ...p, prescription: e.target.value }))}
                      placeholder="Medications, dosage…"
                      style={s.textarea}
                    />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button type="submit" disabled={submitting} style={s.saveBtn}>
                        {submitting ? "Saving & anchoring…" : "Save + Anchor on-chain ⬡"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        style={s.cancelBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Records list */}
                <div style={s.list}>
                  {records.map((r) => (
                    <div key={r.record_id} style={s.recordCard}>
                      <div style={s.recordMeta}>
                        <span style={s.recordDate}>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={s.recordField}>
                        <span style={s.fieldLabel}>Diagnosis</span> {r.diagnosis}
                      </p>
                      <p style={s.recordField}>
                        <span style={s.fieldLabel}>Rx</span> {r.prescription}
                      </p>
                      <div style={{ marginTop: "10px" }}>
                        <BlockchainBadge txHash={r.tx_hash} recordId={r.record_id} />
                      </div>
                    </div>
                  ))}
                  {records.length === 0 && <p style={s.empty}>No records yet.</p>}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Appointments tab ─────────────────────────────── */}
        {tab === "appointments" && (
          <section style={s.section}>
            <h2 style={s.sectionTitle}>Appointments</h2>
            {appointments.length === 0 && <p style={s.empty}>No appointments scheduled.</p>}
            <div style={s.list}>
              {appointments.map((a) => (
                <div key={a.appointment_id} style={s.apptCard}>
                  <div style={{ flex: 1 }}>
                    <p style={s.patientName}>{a.patient_name || "Patient"}</p>
                    <p style={s.patientSub}>
                      {new Date(a.scheduled_at).toLocaleString()}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                  {a.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleAppointmentStatus(a.appointment_id, "CONFIRMED")}
                        style={s.confirmBtn}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleAppointmentStatus(a.appointment_id, "DONE")}
                        style={s.doneBtn}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { PENDING: "#f59e0b", CONFIRMED: "#3b82f6", DONE: "#10b981" };
  const c = colors[status] || "#64748b";
  return (
    <span style={{ fontSize: "11px", fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {status}
    </span>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "#080d14",
    fontFamily: "'Sora', sans-serif",
    color: "#e2e8f0",
  },
  sidebar: {
    width: "220px",
    flexShrink: 0,
    background: "rgba(13,20,30,0.98)",
    borderRight: "1px solid rgba(20,184,166,0.12)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    gap: "8px",
  },
  sideTop: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" },
  logo: { fontSize: "24px", color: "#14b8a6" },
  logoTitle: { margin: 0, fontSize: "14px", fontWeight: 700, color: "#e2e8f0" },
  nav: { display: "flex", flexDirection: "column", gap: "4px", flex: 1 },
  navBtn: (active) => ({
    padding: "10px 14px",
    borderRadius: "8px",
    border: "none",
    background: active ? "rgba(20,184,166,0.15)" : "transparent",
    color: active ? "#14b8a6" : "#64748b",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    textAlign: "left",
    fontFamily: "'Sora', sans-serif",
    transition: "all 0.2s",
  }),
  sideFooter: { borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" },
  userName: { margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: "#e2e8f0" },
  userRole: { margin: "0 0 12px", fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" },
  logoutBtn: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(239,68,68,0.25)",
    background: "transparent",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'Sora', sans-serif",
    width: "100%",
  },
  main: { flex: 1, padding: "32px", overflowY: "auto" },
  columns: { display: "flex", gap: "24px", alignItems: "flex-start" },
  section: { flex: 1, minWidth: 0 },
  sectionTitle: { margin: "0 0 16px", fontSize: "18px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" },
  recordsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  empty: { color: "#475569", fontSize: "14px" },
  patientCard: (active) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
    borderRadius: "10px",
    border: `1px solid ${active ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.06)"}`,
    background: active ? "rgba(20,184,166,0.08)" : "rgba(255,255,255,0.02)",
    cursor: "pointer",
    transition: "all 0.2s",
  }),
  avatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #14b8a6, #0891b2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "15px",
    color: "#fff",
    flexShrink: 0,
  },
  patientName: { margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "#e2e8f0" },
  patientSub: { margin: 0, fontSize: "12px", color: "#64748b" },
  successBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
    padding: "12px 16px",
    borderRadius: "8px",
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.25)",
    marginBottom: "12px",
    fontSize: "14px",
    color: "#6ee7b7",
  },
  form: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" },
  label: { fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" },
  textarea: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#e2e8f0",
    resize: "vertical",
    fontFamily: "'Sora', sans-serif",
    outline: "none",
  },
  saveBtn: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #14b8a6, #0891b2)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'Sora', sans-serif",
  },
  cancelBtn: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "'Sora', sans-serif",
  },
  addBtn: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(20,184,166,0.4)",
    background: "rgba(20,184,166,0.1)",
    color: "#14b8a6",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    fontFamily: "'Sora', sans-serif",
  },
  recordCard: {
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.02)",
  },
  recordMeta: { marginBottom: "8px" },
  recordDate: { fontSize: "11px", color: "#475569", fontFamily: "'DM Mono', monospace" },
  recordField: { margin: "4px 0", fontSize: "13px", color: "#cbd5e1" },
  fieldLabel: { fontWeight: 700, color: "#64748b", marginRight: "6px", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.06em" },
  apptCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "rgba(255,255,255,0.02)",
    flexWrap: "wrap",
  },
  confirmBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(59,130,246,0.4)",
    background: "rgba(59,130,246,0.1)",
    color: "#60a5fa",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'Sora', sans-serif",
  },
  doneBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(16,185,129,0.4)",
    background: "rgba(16,185,129,0.1)",
    color: "#34d399",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'Sora', sans-serif",
  },
};
