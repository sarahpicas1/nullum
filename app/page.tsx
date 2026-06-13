import { AuditForm } from "./components/AuditForm";
import { AuditPulse } from "./components/AuditPulse";
import { VerifyLink } from "./components/VerifyLink";

const panelStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #1e1e1e",
  borderRadius: "4px",
  padding: "24px",
  flex: "1 1 0",
  minWidth: 0,
};

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      {/* Top bar */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#444",
              letterSpacing: "0.06em",
              fontStyle: "italic",
            }}
          >
            No AI decision without a record.
          </span>
          <VerifyLink />
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Two-panel layout */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "28px",
            flexWrap: "wrap",
            alignItems: "stretch",
          }}
        >
          <div style={panelStyle}>
            <AuditForm />
          </div>
          <div style={{ ...panelStyle, minWidth: "340px", display: "flex", flexDirection: "column" }}>
            <AuditPulse />
          </div>
        </div>

        {/* ACP machine-readable notice */}
        <div
          style={{
            border: "1px solid #1a1e1a",
            borderRadius: "4px",
            padding: "14px 20px",
            background: "#0d110d",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-block",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#3a7a3a",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "#5a8a5a",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.04em",
              }}
            >
              This agent is ACP-readable
            </span>
            <span style={{ fontSize: "11px", color: "#333" }}>
              — AI agents can query audit decisions programmatically via the index endpoint.
            </span>
          </div>
          <a
            href="/api/acp"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "11px",
              color: "#3a7a3a",
              fontFamily: "'JetBrains Mono', monospace",
              textDecoration: "none",
              border: "1px solid #1a3a1a",
              borderRadius: "3px",
              padding: "4px 10px",
              whiteSpace: "nowrap",
            }}
          >
            GET /api/acp →
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #1a1a1a",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "11px", color: "#333", fontFamily: "'JetBrains Mono', monospace" }}>
          NULLUM v0.1.0
        </span>
        <span style={{ fontSize: "11px", color: "#333" }}>
          Built on Hedera  ·  Testnet
        </span>
      </footer>
    </div>
  );
}
