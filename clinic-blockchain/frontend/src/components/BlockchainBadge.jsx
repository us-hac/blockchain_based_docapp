import { useState } from "react";
import api from "../api/axios";

/**
 * BlockchainBadge
 * Props:
 *   txHash   — the on-chain transaction hash (string)
 *   recordId — used to call the verify endpoint
 *   verified — initial verification state (true | false | null = unchecked)
 */
export default function BlockchainBadge({ txHash, recordId, verified: initialVerified = null }) {
  const [status, setStatus] = useState(initialVerified); // true | false | null
  const [checking, setChecking] = useState(false);

  if (!txHash) {
    return (
      <span style={styles.pending}>
        <span style={styles.dot("#f59e0b")} />
        Pending chain write…
      </span>
    );
  }

  const short = `${txHash.slice(0, 10)}…${txHash.slice(-6)}`;
  const explorerUrl = `${process.env.REACT_APP_EXPLORER_URL || "http://localhost:7545"}/tx/${txHash}`;

  const handleVerify = async (e) => {
    e.stopPropagation();
    if (!recordId) return;
    setChecking(true);
    try {
      const { data } = await api.get(`/records/${recordId}/verify`);
      setStatus(data.verified);
    } catch {
      setStatus(false);
    } finally {
      setChecking(false);
    }
  };

  const color = status === true ? "#10b981" : status === false ? "#ef4444" : "#6366f1";
  const label = status === true ? "Verified on-chain" : status === false ? "Hash mismatch!" : "Anchored on-chain";

  return (
    <div style={styles.wrapper(color)}>
      <div style={styles.row}>
        <span style={styles.dotEl(color)} />
        <span style={styles.label(color)}>{label}</span>
      </div>

      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer"
        style={styles.hash(color)}
        title={txHash}
      >
        {short}
      </a>

      <button
        onClick={handleVerify}
        disabled={checking}
        style={styles.btn(color)}
      >
        {checking ? "Checking…" : "Verify ↗"}
      </button>
    </div>
  );
}

// --- inline styles -------------------------------------------------------

const styles = {
  pending: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#f59e0b",
    fontFamily: "'DM Mono', monospace",
  },
  dot: (color) => ({
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
  }),
  wrapper: (color) => ({
    display: "inline-flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: `1px solid ${color}33`,
    background: `${color}11`,
    fontFamily: "'DM Mono', monospace",
    fontSize: "12px",
    minWidth: 180,
  }),
  row: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dotEl: (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
    boxShadow: `0 0 6px ${color}`,
  }),
  label: (color) => ({
    color,
    fontWeight: 600,
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  }),
  hash: (color) => ({
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "11px",
    letterSpacing: "0.02em",
    transition: "color 0.2s",
    cursor: "pointer",
  }),
  btn: (color) => ({
    marginTop: "2px",
    padding: "3px 8px",
    borderRadius: "4px",
    border: `1px solid ${color}55`,
    background: "transparent",
    color,
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "'DM Mono', monospace",
    transition: "background 0.2s",
    alignSelf: "flex-start",
  }),
};
