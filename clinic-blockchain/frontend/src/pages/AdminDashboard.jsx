import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState("users");

  const load = useCallback(async () => {
    try {
      const [usersRes, logsRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/audit-logs"),
      ]);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleUser = async (userId, active) => {
    try {
      await api.patch(`/admin/users/${userId}`, { active: !active });
      setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, active: !active } : u));
    } catch (err) {
      alert("Failed to update user.");
    }
  };

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logo}>⬡</div>
          <p style={s.logoTitle}>ClinicChain</p>
        </div>
        <nav style={s.nav}>
          <button onClick={() => setTab("users")} style={s.navBtn(tab === "users")}>👥 Users</button>
          <button onClick={() => setTab("logs")} style={s.navBtn(tab === "logs")}>📜 Audit Logs</button>
        </nav>
        <div style={s.sideFooter}>
          <p style={s.userName}>{user?.name}</p>
          <p style={s.userRole}>Admin</p>
          <button onClick={logout} style={s.logoutBtn}>Sign out</button>
        </div>
      </aside>

      <main style={s.main}>
        {tab === "users" && (
          <section>
            <h2 style={s.sectionTitle}>User Management</h2>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Name", "Email", "Role", "Joined", "Status", "Action"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} style={s.tr}>
                    <td style={s.td}>{u.name}</td>
                    <td style={{ ...s.td, color: "#64748b", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>{u.email}</td>
                    <td style={s.td}><RolePill role={u.role} /></td>
                    <td style={{ ...s.td, color: "#64748b", fontSize: "12px" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={s.td}>
                      <span style={{ color: u.active !== false ? "#10b981" : "#ef4444", fontWeight: 600, fontSize: "12px" }}>
                        {u.active !== false ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button
                        onClick={() => toggleUser(u.user_id, u.active !== false)}
                        style={s.toggleBtn(u.active !== false)}
                      >
                        {u.active !== false ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "logs" && (
          <section>
            <h2 style={s.sectionTitle}>Blockchain Audit Logs</h2>
            <p style={s.sub}>All actions are immutably recorded on-chain.</p>
            <div style={s.logList}>
              {logs.map((l) => (
                <div key={l.log_id} style={s.logRow}>
                  <span style={s.logTime}>{new Date(l.logged_at).toLocaleString("en-IN")}</span>
                  <span style={s.logAction}>{l.action}</span>
                  <span style={s.logUser}>{l.user_name || l.user_id}</span>
                  {l.tx_hash && (
                    <span style={s.logHash}>{l.tx_hash.slice(0, 12)}…{l.tx_hash.slice(-6)}</span>
                  )}
                </div>
              ))}
              {logs.length === 0 && <p style={{ color: "#475569" }}>No audit logs yet.</p>}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function RolePill({ role }) {
  const map = {
    PATIENT: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    DOCTOR: { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
    ADMIN: { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  };
  const t = map[role] || { color: "#94a3b8", bg: "transparent" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, ...t }}>
      {role}
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
  main: { flex: 1, padding: "32px", overflowY: "auto" },
  sectionTitle: { margin: "0 0 20px", fontSize: "22px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" },
  sub: { margin: "-12px 0 16px", fontSize: "13px", color: "#475569" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
  td: { padding: "12px 14px", fontSize: "14px", color: "#cbd5e1", verticalAlign: "middle" },
  toggleBtn: (active) => ({
    padding: "5px 10px",
    borderRadius: "6px",
    border: `1px solid ${active ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
    background: active ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
    color: active ? "#f87171" : "#34d399",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "'Sora', sans-serif",
  }),
  logList: { display: "flex", flexDirection: "column", gap: "6px" },
  logRow: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    flexWrap: "wrap",
    fontSize: "13px",
  },
  logTime: { color: "#475569", fontFamily: "'DM Mono', monospace", fontSize: "11px", minWidth: "140px" },
  logAction: { color: "#14b8a6", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" },
  logUser: { color: "#94a3b8", flex: 1 },
  logHash: { color: "#334155", fontFamily: "'DM Mono', monospace", fontSize: "11px" },
};
