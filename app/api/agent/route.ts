import { NextRequest, NextResponse } from "next/server";
import { auditDecision } from "../../../agent/tools/auditDecision";
import { runAgent } from "../../../agent";
import type { DecisionPayload } from "../../../lib/types";

export const runtime = "nodejs";
export const maxDuration = 25; // Netlify free tier max ~26s

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // ── Structured audit request ──────────────────────────────────────────
  if (body.type === "audit" && body.payload) {
    const payload = body.payload as DecisionPayload;

    const required: (keyof DecisionPayload)[] = [
      "decisionId",
      "decisionType",
      "modelUsed",
      "output",
      "submittedBy",
    ];

    for (const field of required) {
      if (!payload[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    if (
      typeof payload.confidence !== "number" ||
      payload.confidence < 0 ||
      payload.confidence > 1
    ) {
      return NextResponse.json(
        { error: "confidence must be a number between 0 and 1" },
        { status: 400 }
      );
    }

    try {
      const result = await auditDecision(payload);
      if (!result.success) {
        return NextResponse.json(result, { status: 500 });
      }
      return NextResponse.json(result);
    } catch (err) {
      console.error("[Nullum] Audit error:", err);
      return NextResponse.json(
        {
          error: "Internal error during audit",
          detail: (err as Error).message,
        },
        { status: 500 }
      );
    }
  }

  // ── Conversational chat request ───────────────────────────────────────
  if (body.type === "chat" || typeof body.message === "string") {
    const message = (body.message as string) ?? "";

    if (!message.trim()) {
      return NextResponse.json(
        { error: "message must be a non-empty string" },
        { status: 400 }
      );
    }

    try {
      console.log(`[Nullum API] Chat request: ${message.substring(0, 50)}`);
      const reply = await runAgent(message);
      console.log(`[Nullum API] Chat response generated: ${reply.substring(0, 50)}`);
      return NextResponse.json({ type: "chat", message: reply });
    } catch (err) {
      const errorMsg = (err as Error).message;
      const errorStack = (err as Error).stack;
      console.error("[Nullum API] Chat failed:", {
        message: errorMsg,
        stack: errorStack,
        rawError: err,
      });
      return NextResponse.json(
        {
          error: "Chat failed",
          detail: errorMsg,
          type: (err as Error).constructor.name,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      error:
        'Request must include { type: "audit", payload: {...} } or { type: "chat", message: "..." }',
    },
    { status: 400 }
  );
}
