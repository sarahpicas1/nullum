import {
  Client,
  AccountId,
  PrivateKey,
} from "@hashgraph/sdk";

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
    PrivateKey.fromString(privateKey)
  );

  return client;
}

export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Environment variable ${key} is not set`);
  return val;
}
