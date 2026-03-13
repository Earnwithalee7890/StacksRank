# 🚀 StacksRank Mainnet Deployment Guide

## Prerequisites
1. **Stacks Wallet** with ~2.0 STX for deployment fees.
2. **Clarinet** (latest version) for deployment planning.
3. **Hiro API Key** (optional, for faster explorer indexing).

---

## 🏗️ Phase 1: Smart Contract Deployment

### 1. Compile Check
```bash
clarinet check
```
Ensure all 10+ core and trait contracts pass semantic validation.

### 2. Deployment Order
Contracts must be deployed in the following order due to trait dependencies:

1.  **Traits & Libs**:
    *   `contracts/traits/governance-trait.clar`
    *   `contracts/traits/guard-trait.clar`
    *   `contracts/lib/error-codes.clar`
2.  **Core Protocol**:
    *   `contracts/access-control.clar` (Implements `guard-trait`)
    *   `contracts/governance.clar` (Implements `governance-trait`)
    *   `contracts/advanced-swap.clar`
    *   `contracts/simple-reputation.clar`

### 3. Generate Deployment Plan
```bash
clarinet deployments generate --mainnet
```

### 4. Apply Deployment
Update the `expected-sender` in the generated YAML and run:
```bash
clarinet deployments apply -p deployments/mainnet.yaml
```

---

## 🛡️ Phase 2: Post-Deployment initialization

After deployment, you must initialize the protocol permissions:

```clarity
;; 1. Set up initial roles in Access Control
(contract-call? .access-control set-role 'SP... "ADMIN")

;; 2. Register your admin profile
(contract-call? .simple-reputation register-user)

;; 3. Seed initial liquidity (if applicable)
(contract-call? .advanced-swap create-pool u1000000 u1000000)
```

---

## 🔍 Phase 3: Explorer Verification

1.  Connect your wallet to [Hiro Explorer](https://explorer.hiro.so/).
2.  Navigate to each deployed contract address.
3.  Click **"Verify Source"**.
4.  Upload the `.clar` file. **Important**: Verified contracts receive a significantly higher trust score on the Talent Protocol leaderboard.

---

## 🌐 Phase 4: Frontend Integration

Update your `.env.production` file:

```env
VITE_STACKS_NETWORK=mainnet
VITE_REPUTATION_CONTRACT=SP...simple-reputation
VITE_SWAP_CONTRACT=SP...advanced-swap
VITE_GOVERNANCE_CONTRACT=SP...governance
VITE_ACCESS_CONTRACT=SP...access-control
```

---

## 🏅 Talent Protocol Eligibility Checklist
- [ ] Connect Wallet to [talent.app](https://talent.app)
- [ ] Connect GitHub (Ensure this repo is Public)
- [ ] Verify all 4 core contracts on the explorer
- [ ] Perform at least one Mainnet transaction (e.g., `register-user`)
- [ ] Ensure `Stacks.js` and `@stacks/connect` are used (Verified via our `src/` code)

---
*For technical support, join the Stacks Discord or open an issue in this repository.*
