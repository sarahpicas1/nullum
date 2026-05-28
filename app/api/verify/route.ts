import { NextRequest, NextResponse } from "next/server";

interface HCSMessage {
  sequence_number: number;
  consensus_timestamp: string;
  message: string;
}

interface AuditRecord {
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

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

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

    // Determine if query is a sequence number or decision ID
    const isSequenceNumber = /^\d+$/.test(query);
    const searchValue = query.toLowerCase();

    for (const msg of messages) {
      try {
        // Decode base64 message content
        const decoded = Buffer.from(msg.message, "base64").toString("utf-8");
        const record: AuditRecord = JSON.parse(decoded);

        // Match by sequence number or decision ID
        if (
          (isSequenceNumber && msg.sequence_number === parseInt(query, 10)) ||
          (!isSequenceNumber && record.decisionId.toLowerCase() === searchValue)
        ) {
          // Attach sequence number and timestamp from the HCS message
          record.sequenceNumber = msg.sequence_number;
          record.consensusTimestamp = msg.consensus_timestamp;

          return NextResponse.json({ success: true, record });
        }
      } catch {
        // Skip messages that fail to decode/parse
        continue;
      }
    }

    return NextResponse.json(
      { error: "Record not found", success: false },
      { status: 404 }
    );
  } catch (err) {
    console.error("[Verify API] Error:", err);
    return NextResponse.json(
      {
        error: "Failed to query Hedera",
        detail: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
