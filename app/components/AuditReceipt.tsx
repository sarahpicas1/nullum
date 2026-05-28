"use client";

import { useState } from "react";
import type { AuditReceipt as AuditReceiptType } from "../../lib/types";

interface Props {
  receipt: AuditReceiptType;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: copied ? "#4ade80" : "#555",
        fontSize: "12px",
        padding: "0 4px",
        fontFamily: "inherit",
      }}
      title="Copy"
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td
        style={{
          color: "#888",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: "6px 12px 6px 0",
          whiteSpace: "nowrap",
          verticalAlign: "top",
        }}
      >
        {label}
      </td>
      <td
        style={{
          fontFamily: "'JetBrains Mono', 'Courier New', monospace",
          fontSize: "12px",
          color: "#e8e0d0",
          padding: "6px 8px 6px 0",
          wordBreak: "break-all",
        }}
      >
        {value}
      </td>
      <td style={{ verticalAlign: "top", paddingTop: "4px" }}>
        <CopyButton value={value} />
      </td>
    </tr>
  );
}

export function AuditReceipt({ receipt }: Props) {
  return (
    <div
      style={{
        border: "1px solid #4ade8044",
        borderLeft: "3px solid #4ade80",
        background: "#0d160d",
        borderRadius: "4px",
        padding: "20px 24px",
        marginTop: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <span style={{ color: "#4ade80", fontSize: "14px" }}>✓</span>
        <span
          style={{
            color: "#4ade80",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Audit Complete
        </span>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          <Row label="Audit ID" value={receipt.auditId} />
          <Row label="HCS Topic ID" value={receipt.hcsTopicId} />
          <Row
            label="HCS Sequence No."
            value={receipt.hcsSequenceNumber.toString()}
          />
          <Row label="NFT Token ID" value={receipt.nftTokenId} />
          <Row label="NFT Serial No." value={receipt.nftSerial.toString()} />
          <Row label="HBAR Paid" value={`${receipt.hbarPaid.toFixed(6)} ℏ`} />
          <Row label="USD Equivalent" value={`$${receipt.usdEquivalent.toFixed(2)}`} />
          <Row label="Price Source" value={receipt.priceSource} />
          <Row label="Payment TX" value={receipt.paymentTxId} />
          <Row label="Timestamp" value={receipt.timestamp} />
        </tbody>
      </table>

      <div style={{ marginTop: "16px", borderTop: "1px solid #1a2a1a", paddingTop: "14px", display: "flex", gap: "16px" }}>
        <a
          href={receipt.explorerUrl}
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
        <a
          href={`https://hashscan.io/testnet/token/${receipt.nftTokenId}/${receipt.nftSerial}`}
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
          View NFT Certificate →
        </a>
      </div>
    </div>
  );
}
