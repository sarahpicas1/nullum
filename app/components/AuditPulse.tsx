"use client";

import { useState, useEffect, useCallback } from "react";

const MIRROR_URL =
  "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.9054947/messages?limit=100&order=desc";

const HASHSCAN_BASE = "https://hashscan.io/testnet/topic/0.0.9054947";

const DECISION_COLORS: Record<string, string> = {
  loan_approval: "#3b82f6",
  fraud_detection: "#ef4444",
  hiring_decision: "#a855f7",
  content_moderation: "#f97316",
  risk_scoring: "#eab308",
};

function getDecisionColor(type: string): string {
  const lower = type.toLowerCase();
  for (const [key, color] of Object.entries(DECISION_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#6b7280";
}

function formatTimestamp(ts: string): string {
  const date = new Date(parseFloat(ts) * 1000);
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} · ${h}:${m} UTC`;
}

function decodeHCSMessage(b64: string): { decisionType: string; confidence: number } {
  try {
    const json = JSON.parse(atob(b64));
    const raw = json.confidence ?? 0;
    const confidence = typeof raw === "number" ? (raw <= 1 ? raw * 100 : raw) : 0;
    return {
      decisionType: json.decisionType ?? json.decision_type ?? "other",
      confidence,
    };
  } catch {
    return { decisionType: "other", confidence: 0 };
  }
}

interface AuditRecord {
  sequenceNumber: number;
  timestamp: string;
  decisionType: string;
  confidence: number;
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #1a1a1a",
        borderLeft: "3px solid #222",
        borderRadius: "3px",
        padding: "14px 16px",
        marginBottom: "10px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
        <div className="ap-shimmer" style={{ height: "11px", width: "38%", borderRadius: "2px" }} />
        <div className="ap-shimmer" style={{ height: "4px", width: "100%", borderRadius: "2px" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="ap-shimmer" style={{ height: "9px", width: "28%", borderRadius: "2px" }} />
          <div className="ap-shimmer" style={{ height: "9px", width: "46%", borderRadius: "2px" }} />
        </div>
      </div>
    </div>
  );
}

function AuditCard({ record }: { record: AuditRecord }) {
  const color = getDecisionColor(record.decisionType);
  const pct = Math.min(100, Math.max(0, record.confidence));

  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid #1a1a1a",
        borderLeft: `3px solid ${color}`,
        borderRadius: "3px",
        padding: "12px 14px",
        marginBottom: "10px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#e8e0d0",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          marginBottom: "9px",
        }}
      >
        {record.decisionType.replace(/_/g, " ")}
      </div>

      <div style={{ marginBottom: "9px" }}>
        <div
          style={{
            fontSize: "10px",
            color: "#888",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.06em",
            marginBottom: "5px",
          }}
        >
          CONFIDENCE {pct.toFixed(0)}%
        </div>
        <div
          style={{
            height: "3px",
            background: "#1e1e1e",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: color,
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span
          style={{
            fontSize: "10px",
            color: "#555",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.06em",
          }}
        >
          RECORD #{record.sequenceNumber}
        </span>
        <span style={{ fontSize: "10px", color: "#3a3a3a" }}>
          {record.timestamp}
        </span>
      </div>

      <a
        href={`${HASHSCAN_BASE}?sequenceNumber=${record.sequenceNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: "10px",
          color: "#4ade80",
          textDecoration: "none",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.06em",
        }}
      >
        → HASHSCAN
      </a>
    </div>
  );
}

export function AuditPulse() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshIn, setRefreshIn] = useState(30);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(MIRROR_URL);
      if (!res.ok) throw new Error("mirror node error");
      const data = await res.json();
      const messages: Array<{ sequence_number: number; consensus_timestamp: string; message: string }> =
        data.messages ?? [];

      const parsed: AuditRecord[] = messages.map((m) => {
        const decoded = decodeHCSMessage(m.message);
        return {
          sequenceNumber: m.sequence_number,
          timestamp: formatTimestamp(m.consensus_timestamp),
          decisionType: decoded.decisionType,
          confidence: decoded.confidence,
        };
      });

      setRecords(parsed);
      if (messages.length > 0) setTotalCount(messages[0].sequence_number);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshIn(30);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshIn((prev) => {
        if (prev <= 1) {
          fetchRecords();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  return (
    <>
      <style>{`
        @keyframes ap-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes ap-shimmer {
          0% { background-position: -300% 0; }
          100% { background-position: 300% 0; }
        }
        .ap-shimmer {
          background: linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%);
          background-size: 300% 100%;
          animation: ap-shimmer 1.6s infinite;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: "1px solid #1a1a1a",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span
              style={{
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: "#e8e0d0",
                textTransform: "uppercase",
              }}
            >
              Audit Pulse
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#4ade80",
                  animation: "ap-pulse 1.6s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  color: "#4ade80",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                }}
              >
                LIVE ON HEDERA
              </span>
            </div>
          </div>

          <div
            style={{
              fontSize: "42px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              color: "#e8e0d0",
              lineHeight: 1,
              marginBottom: "5px",
            }}
          >
            {totalCount.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#3a3a3a",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Decisions Audited On-Chain
          </div>
        </div>

        {/* Feed */}
        <div style={{ overflowY: "auto", maxHeight: "420px" }}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "36px 0" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#ef4444",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                  marginBottom: "14px",
                }}
              >
                HEDERA MIRROR NODE UNAVAILABLE
              </div>
              <button
                onClick={fetchRecords}
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  color: "#e8e0d0",
                  fontSize: "11px",
                  padding: "7px 18px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                }}
              >
                RETRY
              </button>
            </div>
          ) : records.length === 0 ? (
            <div
              style={{
                fontSize: "11px",
                color: "#333",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
                padding: "20px 0",
              }}
            >
              NO RECORDS ON THIS TOPIC YET
            </div>
          ) : (
            records.map((record) => (
              <AuditCard key={record.sequenceNumber} record={record} />
            ))
          )}
        </div>

        {/* Countdown */}
        {!loading && !error && (
          <div
            style={{
              paddingTop: "12px",
              borderTop: "1px solid #1a1a1a",
              fontSize: "10px",
              color: "#2e2e2e",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
            }}
          >
            REFRESHING IN {refreshIn}s
          </div>
        )}
      </div>
    </>
  );
}
