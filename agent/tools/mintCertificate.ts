import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  TokenId,
  AccountId,
  PrivateKey,
  Hbar,
} from "@hashgraph/sdk";
import { createHederaClient } from "../../lib/hedera";

let resolvedTokenId: string | null = null;

export async function ensureNftTokenId(): Promise<string> {
  if (resolvedTokenId) return resolvedTokenId;

  const envTokenId = process.env.NULLUM_NFT_TOKEN_ID;
  if (envTokenId) {
    resolvedTokenId = envTokenId;
    return resolvedTokenId;
  }

  const client = createHederaClient();
  const operatorId = process.env.HEDERA_ACCOUNT_ID!;
  const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);

  const tx = await new TokenCreateTransaction()
    .setTokenName("Nullum Audit Certificate")
    .setTokenSymbol("NULLUM")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(AccountId.fromString(operatorId))
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey)
    .setMaxTransactionFee(new Hbar(30))
    .execute(client);

  const receipt = await tx.getReceipt(client);

  if (!receipt.tokenId) {
    throw new Error(
      "TokenCreateTransaction succeeded but returned no tokenId"
    );
  }

  resolvedTokenId = receipt.tokenId.toString();

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  [Nullum] NFT Collection created on first run║`);
  console.log(`║  Token ID : ${resolvedTokenId.padEnd(32)}║`);
  console.log(`║  Add to .env: NULLUM_NFT_TOKEN_ID=${resolvedTokenId.padEnd(10)}║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);

  return resolvedTokenId;
}

export async function mintCertificate(metadata: string): Promise<{
  tokenId: string;
  serialNumber: number;
}> {
  const tokenId = await ensureNftTokenId();
  const client = createHederaClient();

  const metadataBytes = Buffer.from(metadata, "utf8");

  const tx = await new TokenMintTransaction()
    .setTokenId(TokenId.fromString(tokenId))
    .addMetadata(metadataBytes)
    .setMaxTransactionFee(new Hbar(10))
    .execute(client);

  const receipt = await tx.getReceipt(client);

  if (!receipt.serials || receipt.serials.length === 0) {
    throw new Error("TokenMintTransaction succeeded but returned no serial numbers");
  }

  const serialNumber = Number(receipt.serials[0]);

  return { tokenId, serialNumber };
}
