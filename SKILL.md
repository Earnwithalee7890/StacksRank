---
name: stacksrank
description: Decentralized reputation leaderboard and DeFi orchestration platform on Stacks Bitcoin L2. Tracks builder rankings via on-chain activity, enables trustless atomic STX/SIP-010 swaps, and provides multi-sig ClarityVault treasury management — all powered by Clarity smart contracts on Stacks Mainnet.
version: 1.2.0
author: Earnwithalee7890
license: MIT
---

# StacksRank

> **The ultimate reputation leaderboard and DeFi platform on Bitcoin L2.**
> Track builder rankings, execute trustless swaps, and manage multi-sig vaults — all on-chain with Clarity smart contracts.

**[🔴 Live Demo](https://stacks-rank.vercel.app/)** · **[GitHub](https://github.com/Earnwithalee7890/StacksRank)**

---

## What this skill teaches

This skill covers building and interacting with a full-stack Stacks ecosystem platform that includes:

- **On-chain reputation tracking** — rank builders by real GitHub + blockchain activity
- **Trustless atomic swaps** — STX ↔ SIP-010 tokens (xBTC, USDA) via `simple-swap` contract
- **ClarityVault** — multi-signature treasury management via `simple-vault` contract
- **Hiro API v1 integration** — reading live on-chain data without a centralised backend
- **Leather / Xverse / Asigna wallet** support via direct provider injection

---

## Recommended tools

- **search**: [ripgrep](https://github.com/BurntSushi/ripgrep) — fast code search across the repo
- **deploy**: [Acme Deploy](https://go.productclank.com/s/sk_…) — deploy to Vercel or production
- **format**: [prettier](https://prettier.io) — code formatting
- **lint**: [eslint](https://eslint.org) — static analysis
- **contracts**: [Clarinet](https://github.com/hirosystems/clarinet) — Clarity testing & deployment
- **explorer**: [Hiro Explorer](https://explorer.hiro.so) — verify on-chain contracts
- **runtime**: Node.js >= 18
- **blockchain**: [Stacks](https://stacks.co) — Bitcoin-secured L2

---

## SDK packages

### 1. StacksRank Core SDK
```bash
npm install @earnwithalee/stacksrank-sdk
```
- Clarity type encoding in pure JS
- Programmatic access to all StacksRank contract addresses
- TypeScript declarations included

### 2. STX Contract SDK
```bash
npm install @earnwithalee/stx-contract
```
- Simplified Clarity contract calls
- Vite / Next.js optimised
- TypeScript ready

---

## Quick start (local)

```bash
git clone https://github.com/Earnwithalee7890/StacksRank.git
cd StacksRank
npm install
npx serve .          # serves on http://localhost:3000
# or
python -m http.server 8000
```

Connect your **Leather Wallet** and navigate to `http://localhost:8000`.

---

## Quick start (SDK consumer)

```javascript
import { StacksRankSDK, clarityEncode } from '@earnwithalee/stacksrank-sdk';

const sdk = new StacksRankSDK({ network: 'mainnet' });

// Fetch top builders leaderboard
const leaderboard = await sdk.getLeaderboard({ limit: 10 });

// Get a builder's reputation score
const score = await sdk.getReputation('SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT');

// Encode Clarity principal for a contract call
const encoded = clarityEncode.principal('SP2F500...');
```

---

## Smart contracts (Clarity — Mainnet deployed)

| Contract | Address | Description |
|---|---|---|
| `simple-reputation` | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT` | On-chain builder reputation & ranking |
| `simple-swap` | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT` | Trustless atomic STX/SIP-010 swaps |
| `simple-vault` | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT` | Multi-sig ClarityVault treasury |
| `defi-builder-tools` | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT` | DeFi builder utility contracts |
| `stx-distributor` | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT` | STX reward distribution |

---

## Core features

### 🏆 Dynamic Reputation Leaderboard
Real-time on-chain activity tracking — GitHub contributions, contract interactions, and ecosystem engagement — scored and ranked on the Stacks Mainnet.

### 💱 Trustless Atomic Swaps
Non-custodial STX ↔ SIP-010 token swaps (xBTC, USDA) with instant price calculation. Zero middleman, settled directly on-chain via `simple-swap`.

### 🔒 ClarityVault (Multi-Sig Treasury)
Team and DAO treasury management. Requires M-of-N signatures before any funds are released. Built on `simple-vault` Clarity contract.

---

## Wallet integration (Leather provider API)

```javascript
// Connect Leather wallet
async function connectWallet() {
  if (window.LeatherProvider) {
    const response = await window.LeatherProvider.request('getAddresses');
    const stxAddress = response.result.addresses
      .find(a => a.symbol === 'STX').address;
    return stxAddress;
  }
  throw new Error('Leather wallet not found');
}

// Call a read-only contract function
import { callReadOnlyFunction, cvToValue } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

const result = await callReadOnlyFunction({
  contractAddress: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT',
  contractName: 'simple-reputation',
  functionName: 'get-score',
  functionArgs: [],
  network: new StacksMainnet(),
  senderAddress: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT',
});

console.log('Score:', cvToValue(result));
```

---

## Adding your own reputation metric

```clarity
;; simple-reputation.clar
(define-public (submit-contribution (builder principal) (score uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u403))
    (map-set builder-scores builder score)
    (ok score)
  )
)
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (ES6+), HTML5 |
| Smart Contracts | Clarity 2.0+ (Stacks Mainnet) |
| Wallet | Leather Provider API, Xverse, Asigna |
| Chain API | Hiro Extended API v1 |
| SDK | `@earnwithalee/stacksrank-sdk`, `@earnwithalee/stx-contract` |
| Blockchain | Stacks L2 (Bitcoin-secured) |

---

## License

MIT — see [LICENSE](./LICENSE)
