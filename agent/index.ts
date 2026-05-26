import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { SYSTEM_PROMPT } from "./prompts/system";
import { auditDecision, getHbarUsdPrice } from "./tools/auditDecision";
import type { DecisionPayload, AuditReceipt } from "../lib/types";

// ── Tool: audit_decision ───────────────────────────────────────────────────
const auditDecisionTool = tool(
  async (input) => {
    const payload: DecisionPayload = {
      ...input,
      confidence: input.confidence / 100, // form sends 0-100, spec requires 0-1
    };
    const result = await auditDecision(payload);
    return JSON.stringify(result, null, 2);
  },
  {
    name: "audit_decision",
    description:
      "Submit an AI decision for tamper-proof auditing on Hedera. Executes: HBAR payment → HTS NFT mint → HCS log. Returns a full audit receipt with on-chain references.",
    schema: z.object({
      decisionId: z.string().describe("Unique identifier for this decision"),
      decisionType: z
        .string()
        .describe(
          "Category of AI decision: loan_approval | content_moderation | hiring_decision | risk_scoring | fraud_detection | other"
        ),
      modelUsed: z.string().describe("AI model that produced the decision"),
      inputs: z
        .record(z.unknown())
        .describe("Input features or parameters fed to the model"),
      output: z.string().describe("The decision output or verdict"),
      confidence: z
        .number()
        .min(0)
        .max(100)
        .describe("Confidence score as a percentage (0-100)"),
      submittedBy: z
        .string()
        .describe("Organisation name or account ID submitting this audit"),
    }),
  }
);

// ── Tool: get_audit_fee ────────────────────────────────────────────────────
const getAuditFeeTool = tool(
  async () => {
    const { price, source } = await getHbarUsdPrice();
    const feeHbar = 0.5 / price;
    return JSON.stringify({
      feeUsd: 0.5,
      feeHbar: parseFloat(feeHbar.toFixed(6)),
      hbarUsdRate: parseFloat(price.toFixed(6)),
      source,
    });
  },
  {
    name: "get_audit_fee",
    description:
      "Get the current audit fee in HBAR. Converts the fixed $0.50 USD fee to HBAR using the live CoinCap market rate.",
    schema: z.object({}),
  }
);

// ── Agent factory ──────────────────────────────────────────────────────────
export function createNullumAgent() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not set");

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey,
    temperature: 0,
  });

  const agent = createReactAgent({
    llm,
    tools: [auditDecisionTool, getAuditFeeTool],
    messageModifier: SYSTEM_PROMPT,
  });

  return agent;
}

// ── Convenience: run a single message through the agent ───────────────────
export async function runAgent(message: string): Promise<string> {
  const agent = createNullumAgent();

  const result = await agent.invoke({
    messages: [new HumanMessage(message)],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const content = lastMessage.content;

  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => (typeof c === "string" ? c : JSON.stringify(c)))
      .join("\n");
  }

  return JSON.stringify(content);
}
