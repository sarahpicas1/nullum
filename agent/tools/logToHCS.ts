import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  Hbar,
} from "@hashgraph/sdk";
import { createHederaClient } from "../../lib/hedera";
import type { HCSLogEntry } from "../../lib/types";

let resolvedTopicId: string | null = null;

export async function ensureTopicId(): Promise<string> {
  if (resolvedTopicId) return resolvedTopicId;

  const envTopicId = process.env.NULLUM_TOPIC_ID;
  if (envTopicId) {
    resolvedTopicId = envTopicId;
    return resolvedTopicId;
  }

  const client = createHederaClient();

  const tx = await new TopicCreateTransaction()
    .setTopicMemo("Nullum AI Decision Audit Log v1.0")
    .setMaxTransactionFee(new Hbar(2))
    .execute(client);

  const receipt = await tx.getReceipt(client);

  if (!receipt.topicId) {
    throw new Error("TopicCreateTransaction succeeded but returned no topicId");
  }

  resolvedTopicId = receipt.topicId.toString();

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  [Nullum] HCS Topic created on first run     ║`);
  console.log(`║  Topic ID : ${resolvedTopicId.padEnd(32)}║`);
  console.log(`║  Add to .env: NULLUM_TOPIC_ID=${resolvedTopicId.padEnd(14)}║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);

  return resolvedTopicId;
}

export async function logToHCS(entry: HCSLogEntry): Promise<{
  topicId: string;
  sequenceNumber: number;
}> {
  const topicId = await ensureTopicId();
  const client = createHederaClient();

  const message = JSON.stringify(entry);

  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(TopicId.fromString(topicId))
    .setMessage(message)
    .setMaxTransactionFee(new Hbar(2))
    .execute(client);

  const receipt = await tx.getReceipt(client);

  const sequenceNumber = Number(receipt.topicSequenceNumber);

  return { topicId, sequenceNumber };
}
