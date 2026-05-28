"use client";

import { useState } from "react";
import Link from "next/link";

interface VerifyRecord {
  version: string;
  decisionId: string;
  decisionHash: string;
  paymentTxId: string;
  nftTokenId: string;
  nftSerial: number;
  timestamp: string;
  modelUsed: string;
  decisionType: string;
  confidence: number;
  submittedBy: string;
  auditFeeHbar: number;
  auditFeeUsd: number;
  priceSource: string;
  sequenceNumber?: number;
  consensusTimestamp?: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const day = date.getUTCDate().toString().padStart(2, "0");
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const month = monthNames[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year} · ${hours}:${minutes} UTC`;
}

function ResultTable({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <tr>
      <td
        style={{
          color: "#888",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: "8px 12px 8px 0",
          whiteSpace: "nowrap",
          verticalAlign: "top",
        }}
      >
        {label}
      </td>
      <td
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          color: "#e8e0d0",
          padding: "8px 0",
          wordBreak: "break-all",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export default function VerifyPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<VerifyRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecord(null);

    if (!query.trim()) {
      setError("Please enter an Audit ID or sequence number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/verify?q=${encodeURIComponent(query)}`);

      if (res.ok) {
        const data = await res.json();
        setRecord(data.record);
      } else if (res.status === 404) {
        setError("Record not found. This Audit ID does not exist in the Nullum registry.");
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to verify record");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const topicId = process.env.NEXT_PUBLIC_TOPIC_ID || "0.0.9054947";
  const hashscanUrl = record?.sequenceNumber
    ? `https://hashscan.io/testnet/topic/${topicId}?sequenceNumber=${record.sequenceNumber}`
    : "";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid #1a1a1a",
          padding: "0 32px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#888",
            fontSize: "12px",
            textDecoration: "none",
            fontFamily: "'JetBrains Mono', monospace",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back to Audit
        </Link>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
            fontSize: "15px",
            letterSpacing: "0.12em",
            color: "#e8e0d0",
          }}
        >
          NULLUM
        </span>
        <span style={{ fontSize: "11px", color: "#333" }}>verify</span>
      </header>

      {/* Main */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 600,
              color: "#f5f5f5",
              margin: "0 0 8px 0",
              letterSpacing: "0.02em",
            }}
          >
            VERIFY AUDIT RECORD
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "#888",
              margin: "0",
            }}
          >
            Enter an Audit ID or HCS sequence number to retrieve the permanent on-chain record.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          style={{
            marginBottom: "32px",
            display: "flex",
            gap: "8px",
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Audit ID or sequence number (e.g. dec_... or 9)"
            style={{
              flex: 1,
              background: "#0a0a0a",
              border: "1px solid #222",
              borderRadius: "3px",
              color: "#f5f5f5",
              fontSize: "13px",
              padding: "10px 12px",
              fontFamily: "Inter, sans-serif",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 16px",
              background: loading ? "#1a1a1a" : "#e8e0d0",
              color: loading ? "#444" : "#0a0a0a",
              border: "none",
              borderRadius: "3px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "Querying Hedera..." : "Verify Record →"}
          </button>
        </form>

        {/* Error State */}
        {error && (
          <div
            style={{
              background: "#1a0d0d",
              border: "1px solid #3a1a1a",
              borderRadius: "4px",
              padding: "16px",
              color: "#f87171",
              fontSize: "13px",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {error}
          </div>
        )}

        {/* Result State */}
        {record && (
          <div
            style={{
              border: "1px solid #4ade8044",
              borderLeft: "3px solid #4ade80",
              background: "#0d160d",
              borderRadius: "4px",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              <span style={{ color: "#4ade80", fontSize: "16px" }}>✓</span>
              <span
                style={{
                  color: "#4ade80",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                VERIFIED
              </span>
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "#ccc",
                marginBottom: "20px",
                lineHeight: 1.6,
              }}
            >
              This decision is permanently recorded on Hedera Consensus Service. The audit record is immutable and publicly verifiable.
            </p>

            <div
              style={{
                borderTop: "1px solid #1a2a1a",
                paddingTop: "20px",
                marginBottom: "20px",
              }}
            >
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <tbody>
                  <ResultTable label="Decision ID" value={record.decisionId} />
                  <ResultTable label="Decision Type" value={record.decisionType.toUpperCase()} />
                  <ResultTable label="Model Used" value={record.modelUsed} />
                  <ResultTable label="Confidence" value={`${(record.confidence * 100).toFixed(0)}%`} />
                  <ResultTable label="Submitted By" value={record.submittedBy} />
                  <ResultTable label="Audit Fee" value={`${record.auditFeeHbar.toFixed(6)} ℏ ($${record.auditFeeUsd})`} />
                  <ResultTable label="HCS Topic ID" value={topicId} />
                  <ResultTable label="HCS Sequence No." value={record.sequenceNumber || "—"} />
                  <ResultTable label="NFT Token ID" value={record.nftTokenId} />
                  <ResultTable label="NFT Serial No." value={record.nftSerial} />
                  <ResultTable label="Decision Hash" value={record.decisionHash} />
                  <ResultTable label="Timestamp" value={formatTimestamp(record.timestamp)} />
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <a
                href={hashscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#4ade80",
                  fontSize: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                View on HashScan →
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
