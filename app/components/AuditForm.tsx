"use client";

import { useState, useEffect, useCallback } from "react";
import { AuditReceipt } from "./AuditReceipt";
import type { AuditReceipt as AuditReceiptType } from "../../lib/types";

const DECISION_TYPES = [
  { value: "loan_approval", label: "Loan Approval" },
  { value: "content_moderation", label: "Content Moderation" },
  { value: "hiring_decision", label: "Hiring Decision" },
  { value: "risk_scoring", label: "Risk Scoring" },
  { value: "fraud_detection", label: "Fraud Detection" },
  { value: "other", label: "Other" },
];

function generateDecisionId(): string {
  return `dec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface HbarFee {
  feeHbar: number;
  hbarUsdRate: number;
}

export function AuditForm() {
  const [decisionType, setDecisionType] = useState("loan_approval");
  const [modelUsed, setModelUsed] = useState("");
  const [output, setOutput] = useState("");
  const [confidence, setConfidence] = useState<number>(85);
  const [submittedBy, setSubmittedBy] = useState("");

  const [hbarFee, setHbarFee] = useState<HbarFee | null>(null);
  const [loadingFee, setLoadingFee] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<AuditReceiptType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFee = useCallback(async () => {
    setLoadingFee(true);
    try {
      const coinRes = await fetch(
        "https://api.coincap.io/v2/assets/hedera-hashgraph"
      );
      const data = await coinRes.json();
      const usdRate = parseFloat(data.data.priceUsd);
      setHbarFee({ feeHbar: 0.5 / usdRate, hbarUsdRate: usdRate });
    } catch {
      // Non-critical: fee display is informational only
    } finally {
      setLoadingFee(false);
    }
  }, []);

  useEffect(() => {
    fetchFee();
  }, [fetchFee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReceipt(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "audit",
          payload: {
            decisionId: generateDecisionId(),
            decisionType,
            modelUsed,
            inputs: {},
            output,
            confidence: confidence / 100,
            submittedBy,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Audit failed. Check server logs.");
        return;
      }

      setReceipt(data as AuditReceiptType);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0a0a0a",
    border: "1px solid #222",
    borderRadius: "3px",
    color: "#f5f5f5",
    fontSize: "13px",
    padding: "8px 10px",
    fontFamily: "Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "6px",
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: "14px",
  };

  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "20px",
          paddingBottom: "12px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        Submit Decision for Audit
      </div>

      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Decision Type</label>
          <select
            value={decisionType}
            onChange={(e) => setDecisionType(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
            required
          >
            {DECISION_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Model Used</label>
          <input
            type="text"
            value={modelUsed}
            onChange={(e) => setModelUsed(e.target.value)}
            placeholder="e.g. gemini-2.0-flash"
            style={inputStyle}
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Decision Output</label>
          <textarea
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            placeholder="e.g. Approved: credit score 720, DTI 28%, no derogatory marks"
            style={{ ...inputStyle, height: "72px", resize: "vertical" }}
            required
          />
        </div>

        <div style={{ ...fieldStyle, display: "flex", gap: "14px" }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Confidence Score</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="number"
                min={0}
                max={100}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                style={{ ...inputStyle, width: "80px" }}
                required
              />
              <span style={{ color: "#555", fontSize: "13px" }}>%</span>
            </div>
          </div>

          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Submitted By</label>
            <input
              type="text"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="Organisation or account ID"
              style={inputStyle}
              required
            />
          </div>
        </div>

        <div
          style={{
            fontSize: "12px",
            color: "#555",
            marginBottom: "16px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {loadingFee
            ? "Fetching fee..."
            : hbarFee
            ? `Audit fee: $0.50 ≈ ${hbarFee.feeHbar.toFixed(4)} HBAR`
            : "Audit fee: $0.50"}
        </div>

        {error && (
          <div
            style={{
              color: "#f87171",
              fontSize: "12px",
              marginBottom: "12px",
              padding: "8px 12px",
              background: "#1a0d0d",
              border: "1px solid #3a1a1a",
              borderRadius: "3px",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "10px",
            background: submitting ? "#1a1a1a" : "#e8e0d0",
            color: submitting ? "#444" : "#0a0a0a",
            border: "none",
            borderRadius: "3px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: submitting ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {submitting ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  border: "2px solid #333",
                  borderTopColor: "#888",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Committing to Hedera...
            </>
          ) : (
            "Audit This Decision →"
          )}
        </button>
      </form>

      {receipt && <AuditReceipt receipt={receipt} />}
    </div>
  );
}
