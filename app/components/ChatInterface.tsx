"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

function isCodeLike(text: string): boolean {
  return /[{}\[\]":]/.test(text) && text.length > 40;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#444",
          marginBottom: "4px",
          letterSpacing: "0.05em",
        }}
      >
        {isUser ? "YOU" : "NULLUM"}
      </div>
      <div
        style={{
          maxWidth: "88%",
          padding: "10px 14px",
          background: isUser ? "#1a1a1a" : "#111",
          border: `1px solid ${isUser ? "#2a2a2a" : "#1e1e1e"}`,
          borderRadius: "3px",
          fontSize: "12px",
          color: "#e8e0d0",
          fontFamily: isCodeLike(msg.content)
            ? "'JetBrains Mono', monospace"
            : "Inter, sans-serif",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "agent",
      content:
        "Nullum is ready. Query an audit record, check a decision ID, ask what an audit certificate contains, or request the current HBAR audit fee.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat", message: text }),
      });

      const data = await res.json();
      const reply = data.message ?? data.error ?? "No response.";

      setMessages((prev) => [
        ...prev,
        { role: "agent", content: reply, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          content: `Error: ${(err as Error).message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: "420px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        Ask Nullum
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "12px",
          minHeight: "280px",
          maxHeight: "360px",
        }}
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div
            style={{
              fontSize: "12px",
              color: "#444",
              fontFamily: "'JetBrains Mono', monospace",
              padding: "4px 0",
            }}
          >
            ···
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Query an audit record, check a decision ID, or ask what Nullum does..."
          rows={2}
          style={{
            flex: 1,
            background: "#0a0a0a",
            border: "1px solid #222",
            borderRadius: "3px",
            color: "#f5f5f5",
            fontSize: "12px",
            padding: "8px 10px",
            fontFamily: "Inter, sans-serif",
            resize: "none",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: "8px 14px",
            background: loading || !input.trim() ? "#1a1a1a" : "#e8e0d0",
            color: loading || !input.trim() ? "#444" : "#0a0a0a",
            border: "none",
            borderRadius: "3px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
