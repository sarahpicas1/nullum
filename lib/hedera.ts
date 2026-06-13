import {
  Client,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";

// Parse a Hedera private key from several common encodings. Critically, raw
// 64-char hex keys must be parsed as ECDSA — the generic fromString() defaults
// to Ed25519 for that shape and derives the WRONG public key, which makes every
// transaction fail with INVALID_SIGNATURE.
export function parsePrivateKey(raw: string): PrivateKey {
  const key = raw.trim();
  // DER-encoded keys carry the ASN.1 sequence prefix (30...).
  if (key.startsWith("30")) {
    return PrivateKey.fromStringDer(key);
  }
  // Raw 32-byte hex (64 chars) — treat as ECDSA (this project's operator).
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return PrivateKey.fromStringECDSA(key);
  }
  // Fallback: let the SDK auto-detect.
  return PrivateKey.fromString(key);
}

export function createHederaClient(): Client {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK ?? "testnet";

  if (!accountId || !privateKey) {
    throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set");
  }

  const client =
    network === "mainnet" ? Client.forMainnet() : Client.forTestnet();

  client.setOperator(
    AccountId.fromString(accountId),
    parsePrivateKey(privateKey)
  );

  return client;
}

export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Environment variable ${key} is not set`);
  return val;
}
