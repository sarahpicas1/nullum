import crypto from "crypto";
import {
  TransferTransaction,
  AccountId,
  Hbar,
} from "@hashgraph/sdk";
import { createHederaClient } from "../../lib/hedera";
import { mintCertificate } from "./mintCertificate";
import { logToHCS } from "./logToHCS";
import type {
  DecisionPayload,
  AuditReceipt,
  AuditError,
  HCSLogEntry,
  HbarPriceResponse,
} from "../../lib/types";

const AUDIT_FEE_USD = 0.5;
const COINCAP_URL = "https://api.coincap.io/v2/assets/hedera-hashgraph";
const FALLBACK_HBAR_USD_PRICE = 0.085;

interface HbarPriceResult {
  price: number;
  source: string;
}

export async function getHbarUsdPrice(): Promise<HbarPriceResult> {
  try {
    const res = await fetch(COINCAP_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`CoinCap API returned ${res.status}`);
    }

    const json = (await res.json()) as HbarPriceResponse;
    const price = parseFloat(json.data.priceUsd);

    if (isNaN(price) || price <= 0) {
      throw new Error("CoinCap returned an invalid HBAR price");
    }

    return { price, source: "CoinCap" };
  } catch (err) {
    console.warn(
      `[Nullum] CoinCap unavailable (${(err as Error).message}), using fallback price $${FALLBACK_HBAR_USD_PRICE}/HBAR`
    );
    return { price: FALLBACK_HBAR_USD_PRICE, source: "fallback rate" };
  }
}

export async function auditDecision(
  payload: DecisionPayload
): Promise<AuditReceipt | AuditError> {
  const timestamp = new Date().toISOString();

  // ── Step 1: Hash the decision payload ──────────────────────────────────
  const payloadStr = JSON.stringify(payload);
  const decisionHash = crypto
    .createHash("sha256")
    .update(payloadStr)
    .digest("hex");

  // ── Step 2: USD → HBAR conversion (CoinCap with fallback) ────────────
  const { price: hbarUsdPrice, source: priceSource } = await getHbarUsdPrice();
  const auditFeeHbar = AUDIT_FEE_USD / hbarUsdPrice;
  console.log(
    `[Nullum] Rate via ${priceSource}: 1 HBAR = $${hbarUsdPrice.toFixed(6)} | fee = ${auditFeeHbar.toFixed(6)} HBAR`
  );

  // ── Step 3: HBAR payment to treasury ───────────────────────────────────
  const treasuryId = process.env.NULLUM_TREASURY_ACCOUNT_ID;
  if (!treasuryId) {
    return {
      success: false,
      error: "NULLUM_TREASURY_ACCOUNT_ID is not configured",
      failedStep: "payment",
    };
  }

  const operatorId = process.env.HEDERA_ACCOUNT_ID;
  if (!operatorId) {
    return {
      success: false,
      error: "HEDERA_ACCOUNT_ID is not configured",
      failedStep: "payment",
    };
  }

  let paymentTxId: string;

  try {
    const client = createHederaClient();
    const feeHbar = Hbar.fromTinybars(Math.round(auditFeeHbar * 1e8));

    const transferTx = await new TransferTransaction()
      .addHbarTransfer(AccountId.fromString(operatorId), feeHbar.negated())
      .addHbarTransfer(AccountId.fromString(treasuryId), feeHbar)
      .setMaxTransactionFee(new Hbar(2))
      .execute(client);

    await transferTx.getReceipt(client);
    paymentTxId = transferTx.transactionId.toString();
    console.log(`[Nullum] Payment TX: ${paymentTxId}`);
  } catch (err) {
    return {
      success: false,
      error: `HBAR payment failed: ${(err as Error).message}`,
      failedStep: "payment",
    };
  }

  // ── Step 4: Mint HTS Audit Certificate NFT ─────────────────────────────
  // Only store the 64-byte SHA-256 hash. Hedera enforces a 100-byte metadata
  // limit; the full decision record lives in HCS where there is no size cap.
  const nftMetadata = decisionHash;

  let nftTokenId: string;
  let nftSerial: number;

  try {
    const result = await mintCertificate(nftMetadata);
    nftTokenId = result.tokenId;
    nftSerial = result.serialNumber;
    console.log(`[Nullum] NFT minted: ${nftTokenId}#${nftSerial}`);
  } catch (err) {
    return {
      success: false,
      error: `NFT mint failed: ${(err as Error).message}`,
      failedStep: "nft_mint",
    };
  }

  // ── Step 5: Submit to HCS ──────────────────────────────────────────────
  const hcsEntry: HCSLogEntry = {
    version: "1.0",
    decisionId: payload.decisionId,
    decisionHash,
    paymentTxId,
    nftTokenId,
    nftSerial,
    timestamp,
    modelUsed: payload.modelUsed,
    decisionType: payload.decisionType,
    confidence: payload.confidence,
    submittedBy: payload.submittedBy,
    auditFeeHbar,
    auditFeeUsd: 0.5,
    priceSource,
  };

  let hcsTopicId: string;
  let hcsSequenceNumber: number;

  try {
    const result = await logToHCS(hcsEntry);
    hcsTopicId = result.topicId;
    hcsSequenceNumber = result.sequenceNumber;
    console.log(
      `[Nullum] HCS log: topic ${hcsTopicId} seq #${hcsSequenceNumber}`
    );
  } catch (err) {
    return {
      success: false,
      error: `HCS log failed: ${(err as Error).message}`,
      failedStep: "hcs_log",
    };
  }

  // ── Step 6: Return structured receipt ─────────────────────────────────
  const network = process.env.HEDERA_NETWORK ?? "testnet";
  const explorerUrl = `https://hashscan.io/${network}/topic/${hcsTopicId}?sequenceNumber=${hcsSequenceNumber}`;

  return {
    success: true,
    auditId: payload.decisionId,
    hcsTopicId,
    hcsSequenceNumber,
    nftTokenId,
    nftSerial,
    paymentTxId,
    hbarPaid: auditFeeHbar,
    usdEquivalent: 0.5,
    priceSource,
    explorerUrl,
    timestamp,
  };
}
