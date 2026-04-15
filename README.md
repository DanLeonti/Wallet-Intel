# Wallet Intel Brief

Ethereum wallet intelligence briefing tool for compliance investigators. Paste a wallet address, get a one-page intelligence report: classification, risk verdict, sanctions screening, top counterparties, recent activity, and a plain-English summary.

**Live:** https://wallet-intel-brief.vercel.app

## Features

- **On-chain analysis** — balances, transfers, token holdings, ENS resolution, and wallet age via Alchemy
- **USD valuation** — real-time ETH and ERC-20 token pricing via CoinGecko
- **OFAC sanctions screening** — checks against the U.S. Treasury SDN sanctioned digital currency addresses list
- **AI-powered classification** — wallet type (Exchange / Mixer / OTC / Personal / Unknown) and risk level (Low / Medium / High) with reasoning, powered by Anthropic Claude or OpenAI GPT fallback
- **Template fallback** — rule-based classification and summary when no LLM is available
- **Live ETH stats** — real-time price, 24h change, market cap, and volume displayed below the search bar
- **Trust rules** — the LLM never invents addresses, labels, or numbers; every claim traces to actual API data

## Test Wallets

| Risk Level | Address | Notes |
|-----------|---------|-------|
| Low | `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` | Vitalik Buterin |
| Medium | `0x11cce5830e5753b9eec2c08a0be7cc6d3734c1bc` | Moderate activity patterns |
| High | `0x00000c07575bb4e64457687a0382b4d3ea470000` | High-risk behavioral signals |

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite
- **API proxies:** Vercel Serverless Functions (Node.js)
- **Data sources:** Alchemy (on-chain), CoinGecko (prices), OFAC SDN list (sanctions)
- **LLM:** Anthropic Claude (primary), OpenAI GPT (fallback), template engine (fallback)

## Why These APIs

- **Alchemy** — the most reliable Ethereum JSON-RPC provider with purpose-built endpoints for wallet analysis (`getAssetTransfers`, `getTokenBalances`, `getTokenMetadata`). The free tier provides enough compute units for investigative use without needing a paid plan. Unlike raw node RPC, Alchemy indexes transfer history so we can query inbound/outbound transactions without scanning every block.

- **CoinGecko** — the industry-standard free crypto pricing API. Supports both ETH/USD and ERC-20 token pricing by contract address in a single batched call (`/simple/token_price`), which keeps rate usage low. No API key required for basic use, though a demo key increases rate limits.

- **OFAC SDN List (via GitHub)** — the U.S. Treasury's Office of Foreign Assets Control publishes sanctioned digital currency addresses. We use [0xB10C's maintained extraction](https://github.com/0xB10C/ofac-sanctioned-digital-currency-addresses) which parses the official SDN XML into a clean per-chain text file, updated automatically. This avoids parsing the raw Treasury XML ourselves and ensures we always check against the latest sanctioned Ethereum addresses.

- **Anthropic Claude / OpenAI GPT** — LLMs provide the narrative synthesis layer: classifying wallet behavior patterns into human-readable categories and writing plain-English intelligence summaries. We use a dual-provider fallback chain (Anthropic primary, OpenAI secondary) for reliability, with a rule-based template engine as a third fallback if both are unavailable. The LLM never fetches data or invents facts — it only explains data we hand it.

## Architecture

```
Browser SPA                    Vercel Serverless          External APIs
┌──────────────┐              ┌──────────────┐           ┌─────────────┐
│  React UI    │──/api/llm───▶│  api/llm.ts  │──────────▶│  Anthropic  │
│              │              │              │──────────▶│  OpenAI     │
│  Alchemy     │──direct─────▶│              │           │             │
│  Client      │              └──────────────┘           │  Alchemy    │
│              │              ┌──────────────┐           │             │
│  OFAC Client │──direct─────▶│ api/prices.ts│──────────▶│  CoinGecko  │
│              │              └──────────────┘           │             │
└──────────────┘                                         │  GitHub     │
                                                         │  (OFAC list)│
                                                         └─────────────┘
```

Direct browser calls to Alchemy (supports CORS) and the OFAC GitHub list. Serverless proxies for Anthropic, OpenAI, and CoinGecko to keep API keys server-side.

## Getting Started

### Prerequisites

- Node.js 20+
- API keys: [Alchemy](https://dashboard.alchemy.com/) (free tier works), and [Anthropic](https://console.anthropic.com/), [OpenAI](https://platform.openai.com/), [CoinGecko](https://www.coingecko.com/en/api)

### Setup

```bash
git clone https://github.com/DanLeonti/Wallet-Intel.git
cd Wallet-Intel
npm install
```

Copy the environment file and fill in your API keys:

```bash
cp .env.example .env
```

```env
VITE_ALCHEMY_API_KEY=your_alchemy_key
ANTHROPIC_API_KEY=your_anthropic_key      
OPENAI_API_KEY=your_openai_key            
COINGECKO_API_KEY=your_coingecko_key      
```

The app works with just `VITE_ALCHEMY_API_KEY`. LLM keys enable AI-powered analysis; without them, the template engine handles classification and summaries.

### Run Locally

Start both the API dev server and Vite in parallel:

```bash
# Terminal 1: API server (proxies LLM and CoinGecko calls)
npx tsx dev-server.ts

# Terminal 2: Vite dev server
npm run dev
```

Open http://localhost:5173

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Set environment variables in the Vercel dashboard or via CLI:

```bash
vercel env add VITE_ALCHEMY_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add OPENAI_API_KEY production
vercel env add COINGECKO_API_KEY production
```

## Project Structure

```
├── api/                        Vercel serverless functions
│   ├── llm.ts                  Anthropic → OpenAI fallback proxy
│   └── prices.ts               CoinGecko proxy (ETH price, token prices, stats)
├── src/
│   ├── components/             UI components
│   │   ├── SearchBar.tsx       Address input
│   │   ├── HeaderCard.tsx      Address, ENS, age, balances
│   │   ├── VerdictCard.tsx     Classification + risk badges
│   │   ├── SanctionsBanner.tsx OFAC match/clear status
│   │   ├── CounterpartiesTable.tsx  Top 10 by volume
│   │   ├── RecentActivity.tsx  Last 10 transactions
│   │   ├── AISummary.tsx       Intelligence summary paragraph
│   │   ├── EthStatsBar.tsx     Live ETH market stats
│   │   └── LoadingState.tsx    Skeleton loading UI
│   ├── hooks/
│   │   └── useWalletAnalysis.ts  Orchestrates parallel fetches + LLM
│   ├── lib/
│   │   ├── alchemy.ts         Alchemy JSON-RPC client
│   │   ├── analysis.ts        Counterparties, behavioral signals, USD math
│   │   ├── anthropic.ts       LLM client with trust-rule prompt
│   │   ├── ofac.ts            OFAC list fetch + cached Set lookup
│   │   ├── prices.ts          CoinGecko client via proxy
│   │   ├── template.ts        Rule-based fallback classification
│   │   └── utils.ts           Formatters and helpers
│   └── types/index.ts         Shared TypeScript types
├── dev-server.ts               Local Express API server for development
├── vercel.json                 Vercel deployment config
└── .env.example                Environment variable template
```

## Author

Daniel Leonti
