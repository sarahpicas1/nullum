# NULLUM

**No AI decision without a record.**

## The Problem

AI systems now make consequential decisions at scale: loan approvals, content moderation flags, hiring recommendations, fraud scores. Yet almost none of these decisions leave a verifiable audit trail. When outcomes are questioned, organizations have no tamper-proof record of what model ran, what inputs it received, what it decided, or how confident it was.

Nullum solves this. It's a Hedera-native audit agent that commits every AI decision to chain permanently, producing an immutable certificate and log entry that any auditor, regulator, or counterparty can independently verify.

## How It Works

The audit flow runs in six steps:

1. **Submit** – A decision payload is sent to the Nullum agent with decision type, model used, inputs, output, confidence score, and submitting organization.

2. **Price** – The agent fetches the live HBAR/USD rate from CoinCap and calculates the audit fee ($0.50 USD converted to HBAR).

3. **Pay** – An HBAR transfer is executed from the operator account to the Nullum treasury account. This is the commercial transaction that commits the audit.

4. **Certify** – An HTS NFT is minted on Hedera testnet with the SHA-256 hash of the full decision payload as metadata. This serves as an unforgeable certificate.

5. **Log** – An HCS message is submitted to the Nullum audit topic as a structured JSON record with all audit fields, timestamped and sequenced by Hedera consensus. This is the permanent, publicly verifiable decision log.

6. **Receipt** – The agent returns a structured audit receipt containing the HCS topic ID, HCS sequence number, NFT token ID and serial number, payment transaction ID, and a direct HashScan explorer link.

## Architecture

The system flows from user submission through the Nullum agent, which orchestrates calls to CoinCap for pricing, the Hedera network for payment and certification, and returns a verifiable receipt:

```
User → Nullum Agent
         ├─→ CoinCap API (USD→HBAR rate)
         ├─→ HBAR Transfer (audit fee → treasury)
         ├─→ HTS Mint (NFT audit certificate)
         ├─→ HCS Submit (immutable decision log)
         └─→ Audit Receipt (HashScan link + NFT ID)
```

### Technology Stack

The project is built on Node.js 20+ with the Hedera Agent Kit v4 JavaScript framework. The LLM is Google Gemini 1.5 Flash (free tier, no credit card required). Pricing is handled by the CoinCap plugin. On-chain operations use the Hedera SDK. The frontend is Next.js 14 with an App Router, deployed to Netlify with serverless functions.

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Agent framework | Hedera Agent Kit v4 JS |
| LLM | Google Gemini 1.5 Flash |
| Pricing | CoinCap plugin v1.0.4 |
| Blockchain SDK | @hashgraph/sdk v2.51.0 |
| Frontend | Next.js 14 App Router |
| Deployment | Netlify with serverless functions |

## Getting Started

### Prerequisites

You'll need a Node.js 20+ environment, a Hedera testnet account with HBAR (free at [portal.hedera.com](https://portal.hedera.com)), a second testnet account to receive audit fees, and a Google AI Studio API key (free at [aistudio.google.com](https://aistudio.google.com), no credit card required).

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/nullum.git
cd nullum
npm install
```

### Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Hedera account details and API keys:

```env
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT
HEDERA_PRIVATE_KEY=302e...YOUR_KEY
HEDERA_NETWORK=testnet
NULLUM_TREASURY_ACCOUNT_ID=0.0.YOUR_TREASURY
NULLUM_TOPIC_ID=
NULLUM_NFT_TOKEN_ID=
GOOGLE_API_KEY=YOUR_GOOGLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Leave `NULLUM_TOPIC_ID` and `NULLUM_NFT_TOKEN_ID` blank on first run. Nullum will create these resources automatically.

### First Run

Start the development server:

```bash
npm run dev
```

On the first audit submission, Nullum creates the HCS topic and HTS NFT collection. Watch the console for output like:

```
[Nullum] HCS Topic created on first run
Topic ID : 0.0.XXXXXXX
Add to .env: NULLUM_TOPIC_ID=0.0.XXXXXXX

[Nullum] NFT Collection created on first run
Token ID : 0.0.XXXXXXX
Add to .env: NULLUM_NFT_TOKEN_ID=0.0.XXXXXXX
```

Copy these values into `.env.local` and restart for them to persist.

## Testing

### Submit an Audit

To test the audit flow via curl:

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "type": "audit",
    "payload": {
      "decisionId": "dec_test_001",
      "decisionType": "loan_approval",
      "modelUsed": "gemini-1.5-flash-latest",
      "inputs": {
        "creditScore": 720,
        "annualIncome": 85000,
        "loanAmount": 25000,
        "dti": 0.28
      },
      "output": "APPROVED with credit score above threshold and DTI within limits",
      "confidence": 0.91,
      "submittedBy": "acme-lending-corp"
    }
  }'
```

The response will include the full audit receipt:

```json
{
  "success": true,
  "auditId": "dec_test_001",
  "hcsTopicId": "0.0.XXXXXXX",
  "hcsSequenceNumber": 1,
  "nftTokenId": "0.0.XXXXXXX",
  "nftSerial": 1,
  "paymentTxId": "0.0.XXXXXXX@1234567890.000000000",
  "hbarPaid": 6.25,
  "usdEquivalent": 0.50,
  "priceSource": "CoinCap",
  "explorerUrl": "https://hashscan.io/testnet/topic/0.0.XXXXXXX?sequenceNumber=1",
  "timestamp": "2025-05-25T12:00:00.000Z"
}
```

### Chat with the Agent

You can also query the agent conversationally:

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"type": "chat", "message": "What is the current audit fee in HBAR?"}'
```

## Hedera Tools and Integrations

The audit uses four Hedera blockchain operations:

**CoinCap Plugin** (coincap-hedera-plugin v1.0.4) fetches live HBAR/USD rates for accurate fee calculation. If CoinCap is unavailable, it falls back to a hardcoded $0.085/HBAR rate.

**HBAR Transfer** uses the Hedera SDK TransferTransaction to execute payment of the audit fee from the operator account to the designated treasury account. This is a real, verifiable on-chain transaction.

**HTS NFT Mint** creates an immutable audit certificate with the decision payload hash encoded in NFT metadata. The NFT is stored on the Hedera Token Service and can be independently verified.

**HCS Message Submit** writes the full audit record (decision ID, hash, model, confidence, inputs, outputs, and transaction IDs) to an HCS consensus topic, creating a permanent, timestamped log entry.

| Tool | Implementation | Purpose |
|---|---|---|
| CoinCap Plugin | coincap-hedera-plugin v1.0.4 | Real-time USD/HBAR conversion with fallback |
| HBAR Transfer | TransferTransaction | Commercial audit fee payment |
| HTS NFT Mint | TokenMintTransaction | Tamper-proof audit certificate |
| HCS Message Submit | TopicMessageSubmitTransaction | Immutable decision log |

## Why Hedera

Hedera offers properties that make it ideal for audit infrastructure. HCS (Hedera Consensus Service) achieves transaction finality in 3 to 5 seconds, meaning audit records are confirmed and timestamped by the network within seconds, not minutes or hours. Hedera fees are fixed and predictable, so audit costs are deterministic with no gas auctions or volatility.

Hedera is governed by a council of global enterprises including Google, IBM, Boeing, and Deutsche Telekom. This governance model means the audit infrastructure itself is built on enterprise consensus, not speculative token economics.

Finally, every HCS message and HTS NFT is queryable on HashScan by anyone without needing a wallet or API key, ensuring complete transparency and public verifiability.

## Deployment to Netlify

### Push to GitHub

Initialize a git repository and push to GitHub:

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/nullum.git
git add .
git commit -m "feat: Nullum Week 1 AI Decision Audit Agent"
git push -u origin main
```

### Connect to Netlify

Visit [app.netlify.com](https://app.netlify.com), select "Add new site", and choose "Import an existing project". Connect your GitHub repository. Build settings are automatically detected from `netlify.toml`.

### Set Environment Variables

In the Netlify dashboard under Site configuration and Environment variables, add all variables from `.env.example` with your production values, including the `NULLUM_TOPIC_ID` and `NULLUM_NFT_TOKEN_ID` discovered during first run.

### Deploy

Netlify automatically builds and deploys on every push to main. The @netlify/plugin-nextjs adapter handles all Next.js API routes as serverless functions.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/nullum)

## Week 1 Bounty Checklist

This submission fulfills all Week 1 requirements for the Hedera AI Agent Bounty:

- Built with Hedera Agent Kit v4 JavaScript framework
- Third-party integration: CoinCap plugin for live USD/HBAR conversion
- Multiple non-query Hedera operations: HTS NFT mint and HCS message submit
- Real commercial transaction: HBAR payment from operator to treasury account
- Public GitHub repository
- Live hosted demo on Netlify

## License

MIT
