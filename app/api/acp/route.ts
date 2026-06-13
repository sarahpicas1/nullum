import { NextRequest, NextResponse } from "next/server";

interface HCSMessage {
  sequence_number: number;
  consensus_timestamp: string;
  message: string;
}

interface HCSLogEntry {
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
}

interface ACPDecision {
  decisionId: string;
  decisionType: string;
  confidence: number;
  modelUsed: string;
  timestamp: string;
  hcsSequenceNumber: number;
  consensusTimestamp: string;
  nftTokenId: string;
  nftSerial: number;
  decisionHash: string;
}

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const decisionType = req.nextUrl.searchParams.get("decisionType") ?? null;

  const topicId = process.env.NULLUM_TOPIC_ID;
  if (!topicId) {
    return NextResponse.json(
      { error: "NULLUM_TOPIC_ID is not configured" },
      { status: 500 }
    );
  }

  try {
    const mirrorUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100&order=desc`;

    const res = await fetch(mirrorUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Hedera mirror node" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { messages: HCSMessage[] };
    const messages = data.messages || [];

    const decisions: ACPDecision[] = [];

    for (const msg of messages) {
      try {
        const decoded = Buffer.from(msg.message, "base64").toString("utf-8");
        const entry: HCSLogEntry = JSON.parse(decoded);

        if (decisionType && entry.decisionType !== decisionType) continue;

        decisions.push({
          decisionId: entry.decisionId,
          decisionType: entry.decisionType,
          confidence: entry.confidence,
          modelUsed: entry.modelUsed,
          timestamp: entry.timestamp,
          hcsSequenceNumber: msg.sequence_number,
          consensusTimestamp: msg.consensus_timestamp,
          nftTokenId: entry.nftTokenId,
          nftSerial: entry.nftSerial,
          decisionHash: entry.decisionHash,
        });
      } catch {
        continue;
      }
    }

    const totalAudits = decisions.length;
    const averageConfidence =
      totalAudits > 0
        ? Math.round(
            (decisions.reduce((sum, d) => sum + d.confidence, 0) / totalAudits) * 1000
          ) / 1000
        : 0;

    return NextResponse.json(
      {
        schema: "nullum-acp-v1",
        agent: "Nullum AI Audit Agent",
        description:
          "Nullum audits AI decisions on-chain via Hedera Consensus Service and mints NFT certificates. Query this endpoint to retrieve audit statistics and recent decisions for agent-to-agent interoperability.",
        hcsTopicId: topicId,
        network: "hedera-testnet",
        ...(decisionType ? { filter: { decisionType } } : {}),
        totalAudits,
        averageConfidence,
        recentDecisions: decisions.slice(0, 20),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=30",
        },
      }
    );
  } catch (err) {
    console.error("[ACP API] Error:", err);
    return NextResponse.json(
      { error: "Failed to query Hedera", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
