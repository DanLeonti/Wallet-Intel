Used Opus 4.6 in Cursor

First prompt in plan mode:

Read this entire spec, then BEFORE writing any code, ask me clarifying questions about anything ambiguous and flag any technical risks you see. Do not write code in this turn.

PRODUCT
"Wallet Intel Brief" - an investigator pastes an Ethereum wallet address, 
gets back a one-page intelligence brief: classification, risk verdict, 
top counterparties, key events, and a plain-English summary. Target user 
is a compliance investigator at a firm like Chainalysis or Alterya.

SCOPE
- Ethereum mainnet only
- 3 APIs: Alchemy (on-chain data), CoinGecko (USD prices), OFAC SDN 
  crypto address list (sanctions check)
- Anthropic for narrative synthesis
- React + TypeScript + Tailwind + shadcn/ui
- Single page app, no routing, no auth, no database, no backend server. vercel deployment will be in the last step. Keys in .env.

UI (SINGLE SCREEN)
- Top: search bar accepting a 0x... address
- On submit, show:
  1. Header card: address, ENS if any, age, total ETH+token value in USD
  2. Verdict card: classification (Exchange / Mixer / OTC / Personal / Unknown), 
     risk level (Low/Medium/High), one-paragraph reasoning
  3. Sanctions banner: red alert if address is on OFAC list, green "clear" if not
  4. Counterparties table: top 10 addresses they transact with, with 
     volume in USD and any known label
  5. Recent activity: last 10 notable transactions with USD values
  6. AI summary section (or template-generated paragraph)

TRUST RULES (CRITICAL)
- the LLM NEVER invents addresses, labels, or numbers
- every claim in the UI must trace to actual API response data
- "Unknown" is a valid and preferred answer over guesses
- The LLM only synthesizes/explains data we hand it — it doesn't fetch or invent

NON-GOALS
wallet connect, user accounts, dark mode toggle

DELIVERABLES
modern corporate UX/UI working web app, mobile responsive



---



Q:
Alchemy API plan: Which Alchemy plan/tier do you have? The free tier has rate limits (~330 requests/s for compute units) and some endpoints (like full transfer history) are Growth-tier only. This affects which endpoints I can rely on for transaction history and token balances.

A:
Free tier

Q:
ENS resolution: The spec says to show ENS name if any. Should users also be able to search BY ENS name (e.g. paste 'vitalik.eth' and resolve it to an address), or only display the ENS reverse-lookup for a given 0x address?

A:
Display only (reverse lookup for 0x addresses)

Q:
Wallet classification (Exchange / Mixer / OTC / Personal / Unknown): There's no free public API that reliably labels wallet types. Should the LLM infer the classification from on-chain behavioral patterns (e.g. high fan-out = possible mixer), or do you have access to a labeling service like Etherscan's label API or a static known-address list?

A:
LLM infers from on-chain behavior patterns we provide

Q:
Counterparty table asks for 'any known label' per address. Same question as classification -- where do labels come from? Etherscan has public labels for some addresses. Should I attempt to pull those, or just show 'Unknown' for unlabeled addresses?

A:
Just show 'Unknown' if we don't have a label

Q:
OFAC SDN list: The official OFAC SDN list is an XML/CSV file published by the US Treasury. Should I fetch it live from the Treasury URL at query time, bundle a static copy in the app, or do you have a preferred API endpoint for this?

A:
use this repo for OFAC: https://github.com/0xB10C/ofac-sanctioned-digital-currency-addresses

Q:
The spec mentions 'AI summary section (or template-generated paragraph)'. Should the app work without an Anthropic API key by falling back to a template, or is the Anthropic key always assumed present?

A:
Build a template fallback if API key is missing or call fails



---



lets run local before deoplying to vercel

---

i am using the famous eth founder vitalik wallet: 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

our web app shows Ethereum wallet balance 1.32864539 this is TRUE
but Total Value (USD) shows $16,214.86 WRONG.

how do you calculate total value?

---

print to console log the ethPriceUSD for debug and insure API healthy operations

---

"Total Value (USD)" is missleading change it to "Total All Assets Value (USD)"
and add near the ETH Balance block the ETH Wallet Balance in USD

---

seems like the Anthropic has some outage right now, lets add openai backup for this

---

.env is ready lets build and test

---

now lets deploy to vercel
if any question ask before doing

---

on wide screen the following block gets too big. fix max size :
DOM Path: div#root > div.min-h-.creen bg-background > main.max-w-5xl mx-auto px-4 py-8 > div.max-w-3xl mx-auto .pace-y-4 mt-4 > div.grid grid-col.-1 md:grid-col.-2 gap-4 > div.rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex item.-center gap-3 h-full
Position: top=246px, left=16px, width=593px, height=54px
React Component: SanctionsBanner
HTML Element: <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3 h-full" data-cursor-element-id="cursor-el-1">OFAC Sanctions Check: Clear — address not found on the SDN list</div>

---

dont use grid. move the OFAC Sanctions block under the risk assestment block
if you have any questions ask before doing

---

add a link to the refresh the page and the search on the component: DOM Path: div#root > div.min-h-.creen bg-background > header.border-b border-border bg-card/80 backdrop-blur-.m .ticky top-0 z-10 > div.max-w-5xl mx-auto px-4 py-4 flex item.-center gap-3 > div > h1.text-lg font-bold text-foreground tracking-tight
Position: top=16px, left=64px, width=251px, height=28px
React Component: App
HTML Element: h1 class="text-lg font-bold text-foreground tracking-tight" data-cursor-element-id="cursor-el-1">Wallet Intel Brief

and 

 DOM Path: div#root > div.min-h-.creen bg-background > header.border-b border-border bg-card/80 backdrop-blur-.m .ticky top-0 z-10 > div.max-w-5xl mx-auto px-4 py-4 flex item.-center gap-3 > div.rounded-lg bg-primary p-2
Position: top=20px, left=16px, width=36px, height=36px
React Component: App
HTML Element: div class="rounded-lg bg-primary p-2" data-cursor-element-id="cursor-el-6"

---

remove Debug console.logs from production code

---

deploy the changes to vercel, ensure healthy logs.

---

now add live ETH stats bar, small row showing real-time data from CoinGecko: ETH price, 24h change, marketcap and vol
---

deploy the changes to vercel, ensure healthy logs.

---

deploy to github

---


lets write a readme file

i have used those 3 wallets for testing:
no risk (vitalik): 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
medium risk (from google): 0x11cce5830e5753b9eec2c08a0be7cc6d3734c1bc
high risk (from google): 0x00000c07575bb4e64457687a0382b4d3ea470000

ask me questions before doing, if any

