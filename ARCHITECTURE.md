# StacksRank Architecture

## 🏅 Built for Stacks Builder Rewards

**StacksRank is architecturally designed to maximize your leaderboard position** by excelling in all three ranking criteria:

1. **🔗 Smart Contract Impact**: 3 advanced Clarity 2.0 contracts with real DeFi logic
2. **📦 Library Integration**: Deep use of `@stacks/connect` and `@stacks/transactions`
3. **💻 Public Contributions**: Professional, well-documented public repository

### Ranking Requirements:
- ✅ Connect Bitcoin L2 wallet on [talent.app](https://talent.app) (Leather, Xverse, Asigna, or Fordefi recommended)
- ✅ Connect GitHub profile on [talent.app](https://talent.app) (public repos only tracked)
- ✅ Deploy high-impact smart contracts (we have 3 ready!)
- ✅ Use Stacks libraries extensively (fully integrated!)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         STACKSRANK PLATFORM                      │
│                  Leaderboard • Swap • Vault                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  index.html                                                      │
│  ├── Navigation & Wallet Connection                             │
│  ├── Hero & Stats Dashboard                                     │
│  ├── Leaderboard Table (Real-time rankings)                     │
│  ├── Swap Interface (Token exchange)                            │
│  └── Vault Management (Multi-sig & Staking)                     │
│                                                                  │
│  src/app.js                                                      │
│  ├── Wallet Integration (Stacks Connect)                        │
│  ├── Contract Interaction (Stacks.js)                           │
│  ├── State Management                                           │
│  └── UI Animations                                              │
│                                                                  │
│  src/styles/globals.css                                         │
│  ├── Glassmorphism Design System                               │
│  ├── Gradient Color Palette                                    │
│  ├── Animation Keyframes                                       │
│  └── Responsive Layout                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         Stacks.js 6.0
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STACKS BLOCKCHAIN                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Contract 1: stacksrank-reputation.clar                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  FEATURES:                                               │  │
│  │  • User Registration                                     │  │
│  │  • Daily Check-in System                                │  │
│  │  • Streak Tracking (144 blocks ≈ 1 day)                │  │
│  │  • Quadratic Reputation Scoring                         │  │
│  │  • Ecosystem Contribution Tracking                      │  │
│  │  • Automated Reward Distribution                        │  │
│  │                                                          │  │
│  │  DATA STRUCTURES:                                       │  │
│  │  ├── user-reputation (map)                              │  │
│  │  │   └── {score, streak, last-check-in, contributions} │  │
│  │  ├── daily-check-ins (map)                              │  │
│  │  └── ecosystem-contributions (map)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Contract 2: stx-swap-atomic.clar                        │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  FEATURES:                                               │  │
│  │  • P2P Atomic Swaps (Trustless)                         │  │
│  │  • AMM Liquidity Pools                                  │  │
│  │  • 0.3% Fee Mechanism                                   │  │
│  │  • Slippage Protection                                  │  │
│  │  • SIP-010 Token Support                                │  │
│  │  • Liquidity Provider Rewards                           │  │
│  │                                                          │  │
│  │  DATA STRUCTURES:                                       │  │
│  │  ├── swap-proposals (map)                               │  │
│  │  │   └── {initiator, recipient, amounts, expiry}       │  │
│  │  ├── liquidity-pools (map)                              │  │
│  │  │   └── {reserve-a, reserve-b, total-liquidity}       │  │
│  │  └── user-liquidity (map)                               │  │
│  │                                                          │  │
│  │  ALGORITHMS:                                            │  │
│  │  └── AMM Formula: (amount-in * reserve-out) /          │  │
│  │                    (reserve-in + amount-in)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Contract 3: clarity-vault-multi-sig.clar                │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  FEATURES:                                               │  │
│  │  • Multi-Signature Vaults (2-of-3, 3-of-5, 4-of-7)     │  │
│  │  • Time-Lock Mechanisms                                 │  │
│  │  • Staking with Configurable APY                        │  │
│  │  • Withdrawal Proposal System                           │  │
│  │  • Signature Collection                                 │  │
│  │  • Automated Reward Calculation                         │  │
│  │                                                          │  │
│  │  DATA STRUCTURES:                                       │  │
│  │  ├── vaults (map)                                       │  │
│  │  │   └── {signers, required-sigs, balance, timelock}   │  │
│  │  ├── withdrawal-proposals (map)                         │  │
│  │  │   └── {vault-id, recipient, signatures, executed}   │  │
│  │  └── staking-positions (map)                            │  │
│  │      └── {amount, start-block, reward-rate}            │  │
│  │                                                          │  │
│  │  ALGORITHMS:                                            │  │
│  │  └── Rewards: (amount * blocks-staked * rate) /        │  │
│  │                (10000 * 52560)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Daily Check-in Flow

```
┌──────────┐      ┌───────────────┐      ┌──────────────────┐
│   USER   │─────>│  Frontend     │─────>│  Stacks Wallet   │
│  Clicks  │      │  app.js       │      │  Sign TX         │
└──────────┘      └───────────────┘      └──────────────────┘
                         │                        │
                         v                        v
                  ┌──────────────────────────────────────┐
                  │  stacksrank-reputation.clar           │
                  │  ├── Verify last check-in time       │
                  │  ├── Calculate new streak            │
                  │  ├── Award bonus points              │
                  │  ├── Update user-reputation map      │
                  │  └── Transfer STX reward (if 7+ days)│
                  └──────────────────────────────────────┘
                         │
                         v
                  ┌──────────────┐
                  │   Updated    │
                  │  Leaderboard │
                  └──────────────┘
```

### 2. Token Swap Flow (AMM)

```
┌──────────┐      ┌───────────────┐      ┌──────────────────┐
│   USER   │─────>│  Swap UI      │─────>│  Calculate       │
│  Inputs  │      │ Amount & Token│      │  Output (0.3% fee)│
└──────────┘      └───────────────┘      └──────────────────┘
                         │                        │
                         v                        v
                  ┌──────────────────────────────────────┐
                  │  stx-swap-atomic.clar                 │
                  │  ├── Validate slippage tolerance      │
                  │  ├── Update reserve-a (add tokens in) │
                  │  ├── Update reserve-b (sub tokens out)│
                  │  ├── Record fee for LP rewards        │
                  │  └── Transfer tokens                  │
                  └──────────────────────────────────────┘
                         │
                         v
                  ┌──────────────┐
                  │    Success   │
                  │  Notification│
                  └──────────────┘
```

### 3. Multi-Sig Withdrawal Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│ Signer 1  │────>│ Propose   │────>│  Create   │
│  Creates  │     │ Withdrawal│     │ Proposal  │
└───────────┘     └───────────┘     └───────────┘
                         │
                         v
                  ┌──────────────────────────────────┐
                  │  clarity-vault-multi-sig.clar    │
                  │  ├── Create proposal record      │
                  │  ├── Add signer 1's signature    │
                  │  └── Wait for more signatures    │
                  └──────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    v                    v                    v
┌───────────┐     ┌───────────┐      ┌───────────┐
│ Signer 2  │     │ Signer 3  │      │ Signer 4  │
│   Signs   │     │   Signs   │      │   Signs   │
└───────────┘     └───────────┘      └───────────┘
    │                    │                    │
    └────────────────────┼────────────────────┘
                         v
                  ┌──────────────────────────────────┐
                  │  Threshold Reached?               │
                  │  (e.g., 2 of 3 signatures)        │
                  └──────────────────────────────────┘
                         │ YES
                         v
                  ┌──────────────────────────────────┐
                  │  Auto-Execute Withdrawal          │
                  │  ├── Check time-lock passed      │
                  │  ├── Transfer STX to recipient   │
                  │  ├── Update vault balance        │
                  │  └── Mark proposal as executed   │
                  └──────────────────────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND STACK                        │
├─────────────────────────────────────────────────────────┤
│  HTML5          │  Semantic markup, SEO optimized       │
│  CSS3           │  Glassmorphism, gradients, animations │
│  JavaScript     │  ES6+, async/await                    │
│  Stacks.js 6.0  │  Blockchain interaction               │
│  Stacks Connect │  Wallet integration                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN STACK                       │
├─────────────────────────────────────────────────────────┤
│  Clarity 2.0    │  Smart contract language              │
│  Stacks Chain   │  Layer-1 blockchain                   │
│  Bitcoin        │  Security via PoX                     │
│  SIP-010        │  Token standard                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    TOOLS & DEVOPS                        │
├─────────────────────────────────────────────────────────┤
│  Clarinet       │  Contract development & testing       │
│  Hiro API       │  Blockchain data access               │
│  Hiro Explorer  │  Contract verification                │
│  Git/GitHub     │  Version control                      │
└─────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                        │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Input Validation                              │
│  └── All contract functions validate inputs             │
│                                                          │
│  Layer 2: Permission Checks                             │
│  └── tx-sender verification, signer lists               │
│                                                          │
│  Layer 3: State Verification                            │
│  └── Check existing states before mutations             │
│                                                          │
│  Layer 4: Time-Locks                                    │
│  └── Block-height based delays for critical ops         │
│                                                          │
│  Layer 5: Multi-Signature                               │
│  └── Multiple approvals for high-value operations       │
│                                                          │
│  Layer 6: Atomic Operations                             │
│  └── Either all succeed or all fail (no partial state)  │
└─────────────────────────────────────────────────────────┘
```

## Deployment Pipeline

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│   Local    │───>│  Testnet   │───>│  Mainnet   │───>│  Verified  │
│ Development│    │   Deploy   │    │   Deploy   │    │  Explorer  │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
     │                  │                  │                  │
     v                  v                  v                  v
clarinet check    clarinet deploy   clarinet deploy    Upload source
clarinet test     --testnet         --mainnet          Get badge
clarinet console  Test functions    Real usage         Public trust
```

## User Journey

```
NEW USER
   │
   ├──> 1. Visit StacksRank Website
   │       └── See leaderboard, features, stats
   │
   ├──> 2. Connect Wallet (Leather/Hiro)
   │       └── Stacks Connect integration
   │
   ├──> 3. Register as Builder
   │       └── Call: stacksrank-reputation.register-user()
   │
   ├──> 4. Daily Check-ins
   │       └── Build streak, earn reputation
   │
   ├──> 5. Add Contributions
   │       └── Link GitHub PRs, get bonus points
   │
   ├──> 6. Use Swap
   │       └── Exchange tokens via AMM
   │
   ├──> 7. Create/Join Vault
   │       └── Stake tokens, earn rewards
   │
   └──> 8. Climb Leaderboard
           └── Become top builder! 🏆
```

## Performance Metrics

```
┌─────────────────────────────────────────────────────────┐
│                   TARGET METRICS                         │
├─────────────────────────────────────────────────────────┤
│  Contract Deployment    │  ~30 seconds                  │
│  Function Call          │  ~10 seconds (block confirm)  │
│  UI Load Time          │  < 2 seconds                   │
│  Swap Calculation      │  Instant (client-side)         │
│  Leaderboard Update    │  Real-time                     │
│  Wallet Connection     │  ~3 seconds                    │
└─────────────────────────────────────────────────────────┘
```

---

**Built for Talent Protocol Stacks Event 2026** 🚀

## System Architecture Diagram
- **Frontend**: Next.js / Stacks.js
- **Smart Contracts**: Clarity (Reputation, Swap, Vault)
- **Blockchain**: Stacks Mainnet (Bitcoin L2)
- **Integration**: Leather Wallet, Xverse
