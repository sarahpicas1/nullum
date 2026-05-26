# NULLUM

**No AI decision without a record.**

---

AI systems now make consequential decisions at scale — loan approvals, content moderation flags, hiring recommendations, fraud scores. Yet almost none of these decisions leave a verifiable audit trail. When outcomes are questioned, organizations have no tamper-proof record of what model ran, what inputs it received, what it decided, or how confident it was. Nullum solves this: a Hedera-native audit agent that commits every AI decision to chain permanently, producing an immutable certificate and log entry that any auditor, regulator, or counterparty can independently verify.

---

## How It Works

1. **Submit** — A decision payload is sent to the Nullum agent: decision type, model used, inputs, output, confidence score, and submitting organization.
2. **Price** — The agent fetches the live HBAR/USD rate from CoinCap and calculates the audit fee ($0.50 USD → HBAR).
3. **Pay** — An HBAR transfer is executed from the operator account to the Nullum treasury account. This is the commercial transaction that commits the audit.
4. **Certify** — An HTS NFT is minted on Hedera testnet. The NFT metadata contains the SHA-256 hash of the full decision payload, the decision ID, model used, and timestamp — an unforgeable certificate.
5. **Log** — An HCS message is submitted to the Nullum audit topic. The message is a structured JSON record with all audit fields, timestamped and sequenced by Hedera consensus. This is the permanent, publicly verifiable decision log.
6. **Receipt** — The agent returns a structured audit receipt containing the HCS topic ID, HCS sequence number, NFT token ID and serial number, payment transaction ID, and a direct HashScan explorer link.

---

## Architecture

```
User → Nullum Agent ──→ CoinCap API          (USD→HBAR rate)
                    ──→ HBAR Transfer         (audit fee → treasury)
                    ──→ HTS Mint              (NFT audit certificate)
                    ──→ HCS Submit            (immutable decision log)
                    ──→ Audit Receipt         (HashScan link + NFT ID)
```

### Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Agent framework | Hedera Agent Kit v4 JS (`@hashgraph/hedera-agent-kit`) |
| LLM toolkit | `@hashgraph/hedera-agent-kit-langchain` |
| LLM | Google Gemini 1.5 Flash (free tier) |
| Third-party plugin | `coincap-hedera-plugin@1.0.4` |
| Hedera SDK | `@hiero-ledger/sdk` |
| Frontend | Next.js 14 App Router |
| Deployment | Netlify + `@netlify/plugin-nextjs` |

---

## Setup

### Prerequisites

- Node.js 20+
- A Hedera testnet account with HBAR (get one free at [portal.hedera.com](https://portal.hedera.com))
- A second Hedera testnet account to act as the treasury (receives audit fees)
- A Google AI Studio API key — free at [aistudio.google.com](https://aistudio.google.com), no credit card needed

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/nullum.git
cd nullum
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT
HEDERA_PRIVATE_KEY=302e...YOUR_KEY
HEDERA_NETWORK=testnet
NULLUM_TREASURY_ACCOUNT_ID=0.0.YOUR_TREASURY
NULLUM_TOPIC_ID=               # leave blank — auto-created on first run
NULLUM_NFT_TOKEN_ID=           # leave blank — auto-created on first run
GOOGLE_API_KEY=YOUR_GOOGLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. First Run (Auto-creates HCS Topic + NFT Collection)

```bash
npm run dev
```

On the first audit submission, Nullum will automatically create the HCS topic and HTS NFT collection on testnet and print their IDs to the console:

```
╔══════════════════════════════════════════════╗
║  [Nullum] HCS Topic created on first run     ║
║  Topic ID : 0.0.XXXXXXX                      ║
║  Add to .env: NULLUM_TOPIC_ID=0.0.XXXXXXX   ║
╚══════════════════════════════════════════════╝

╔══════════════════════════════════════════════╗
║  [Nullum] NFT Collection created on first run║
║  Token ID : 0.0.XXXXXXX                      ║
║  Add to .env: NULLUM_NFT_TOKEN_ID=0.0.XXXXXX ║
╚══════════════════════════════════════════════╝
```

Copy these values into your `.env.local` to persist them across restarts.

---

## Testing

### Submit an audit via curl

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "type": "audit",
    "payload": {
      "decisionId": "dec_test_001",
      "decisionType": "loan_approval",
      "modelUsed": "gemini-1.5-flash",
      "inputs": {
        "creditScore": 720,
        "annualIncome": 85000,
        "loanAmount": 25000,
        "dti": 0.28
      },
      "output": "APPROVED — credit score above threshold, DTI within limits",
      "confidence": 0.91,
      "submittedBy": "acme-lending-corp"
    }
  }'
```

### Expected response

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
  "explorerUrl": "https://hashscan.io/testnet/topic/0.0.XXXXXXX?sequenceNumber=1",
  "timestamp": "2025-05-25T12:00:00.000Z"
}
```

### Chat with the agent

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"type": "chat", "message": "What is the current audit fee in HBAR?"}'
```

---

## Hedera Tools Used

| Tool | Package | Purpose |
|---|---|---|
| **CoinCap Plugin** | `coincap-hedera-plugin@1.0.4` | Live USD/HBAR price conversion |
| **HBAR Transfer** | `@hiero-ledger/sdk` · `TransferTransaction` | Commercial audit fee payment to treasury |
| **HTS NFT Mint** | `@hiero-ledger/sdk` · `TokenMintTransaction` | Tamper-proof audit certificate |
| **HCS Message Submit** | `@hiero-ledger/sdk` · `TopicMessageSubmitTransaction` | Immutable, timestamped decision log |

---

## Why Hedera

- **HCS finality in 3–5 seconds** — audit records are confirmed and timestamped by consensus within seconds, not minutes or hours.
- **Fixed, predictable fees** — audit costs are deterministic. No gas auctions, no fee volatility.
- **Enterprise governance** — Hedera is governed by a council of global enterprises (Google, IBM, Boeing, Deutsche Telekom). This is compliance infrastructure built on compliance infrastructure.
- **Public verifiability** — every HCS message and every HTS NFT is queryable by anyone on HashScan without needing a wallet or API key.

---

## Deployment (Netlify)

### 1. Push to GitHub

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/nullum.git
git add .
git commit -m "feat: Nullum Week 1 — AI Decision Audit Agent"
git push -u origin main
```

### 2. Connect to Netlify

- Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
- Select your GitHub repository
- Build settings are auto-detected from `netlify.toml`

### 3. Set Environment Variables

In Netlify dashboard → **Site configuration** → **Environment variables**, add all variables from `.env.example` with their production values. Include the `NULLUM_TOPIC_ID` and `NULLUM_NFT_TOKEN_ID` values discovered on first run.

### 4. Deploy

Netlify will automatically build and deploy. The `@netlify/plugin-nextjs` adapter handles all Next.js API routes as serverless functions.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/nullum)

---

## Week 1 Bounty Compliance

- [x] Built with Hedera Agent Kit v4 JS (`@hashgraph/hedera-agent-kit`)
- [x] Third-party plugin used: CoinCap (`coincap-hedera-plugin@1.0.4`) for live USD→HBAR conversion
- [x] 2+ non-query Hedera tools invoked: HTS NFT mint + HCS message submit
- [x] Commercial transaction completed: HBAR payment from operator to treasury account
- [x] Public GitHub repository
- [x] Live hosted demo URL (Netlify)

---

## License

MIT
