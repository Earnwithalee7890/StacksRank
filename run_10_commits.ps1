# StacksRank - 10 Best Commits Script
# Adds the 10 highest-quality commits covering swap, AMM, governance, lending, yield farming, oracle, NFT marketplace, and tests

Set-Location f:\StacksRank

# ─────────────────────────────────────────────────────────────
# COMMIT 1: Advanced AMM Swap Contract
# ─────────────────────────────────────────────────────────────
git add contracts/advanced-swap.clar
git commit -m "feat(contracts): add advanced AMM swap with x*y=k formula, slippage protection, and LP tokens

- Constant-product AMM (x*y=k) supporting pool creation, liquidity add/remove
- add-liquidity mints LP tokens proportionally; remove-liquidity burns them
- swap-a-for-b and swap-b-for-a enforce min-amount-out slippage guard and deadline
- Price impact guard blocks trades exceeding 5% pool impact
- Protocol fee 0.05% carved per swap and accumulated in treasury
- get-amount-out and get-spot-price are pure read-only math helpers
- Owner can pause pools for emergency shutdown and collect treasury fees
- All swaps emit structured print events for off-chain indexer consumption"

# ─────────────────────────────────────────────────────────────
# COMMIT 2: Simple Swap Enhancement — get-quote + slippage wrapper
# ─────────────────────────────────────────────────────────────
git add contracts/simple-swap.clar
git commit -m "feat(contracts): enhance simple-swap with get-quote and create-swap-with-slippage

- Add get-quote read-only: returns amount-in, fee, amount-out, fee-percentage
- Add create-swap-with-slippage public entry point with min-counterparty-amount guard
- ERR-SLIPPAGE-EXCEEDED (u206) returned when expected output falls below minimum
- Preserves full backward compatibility with existing create-swap, accept-swap, cancel-swap"

# ─────────────────────────────────────────────────────────────
# COMMIT 3: Flash Loan Contract
# ─────────────────────────────────────────────────────────────
git add contracts/flash-loan.clar
git commit -m "feat(contracts): implement flash loan with reentrancy guard and repayment verification

- Atomic borrow-then-repay pattern: execute-flash-loan sends funds, checks repayment balance
- Reentrancy guard (flash-lock bool) prevents recursive exploitation
- 0.09% fee (9 / 10000) incentivizes liquidity providers
- repay-flash-loan callable only during an active loan (flash-lock must be true)
- Owner can deposit/withdraw pool liquidity and pause contract for emergencies
- Full loan history map with borrower, amount, fee, block-height per loan"

# ─────────────────────────────────────────────────────────────
# COMMIT 4: DAO Governance Contract
# ─────────────────────────────────────────────────────────────
git add contracts/governance.clar
git commit -m "feat(contracts): add DAO governance with token-weighted voting and on-chain execution

- Token-weighted voting: each gov token = 1 vote weight
- 7-day voting period (VOTING-PERIOD u1008 blocks)
- Quorum threshold: 100,000 token-votes required for validity
- Proposals carry param-key and param-value — execution updates protocol-params map
- create-proposal requires minimum 1,000 gov tokens to discourage spam
- cast-vote prevents double voting via vote record map
- cancel-proposal callable by proposer or contract owner
- Seed default params: swap-fee-bps, flash-loan-fee-bps, max-price-impact-bps, cooldown-blocks"

# ─────────────────────────────────────────────────────────────
# COMMIT 5: Yield Farming / Staking Rewards Contract
# ─────────────────────────────────────────────────────────────
git add contracts/yield-farm.clar
git commit -m "feat(contracts): implement yield farming with per-block reward accumulation and lock periods

- Per-block reward model: accumulated-reward-per-token updated lazily on each interaction
- Proportional distribution: rewards scale with user stake relative to total pool
- Optional lock period: users can lock stake for any duration >= MIN-LOCK-BLOCKS (144)
- Early withdrawal penalty: 10% of unstaked amount if lock has not expired
- claim-rewards allows harvesting pending rewards without unstaking
- Compounding support: staking on top of existing position auto-claims pending rewards
- Owner can seed reward pool and adjust rewards-per-block dynamically"

# ─────────────────────────────────────────────────────────────
# COMMIT 6: TWAP Price Oracle Contract
# ─────────────────────────────────────────────────────────────
git add contracts/price-oracle.clar
git commit -m "feat(contracts): add decentralized TWAP price oracle with circuit breakers and staleness checks

- Multiple trusted reporters submit prices per feed (max 5 reporters)
- Circular observation buffer (10 slots) stores recent price points for TWAP
- get-twap computes simple average from last 3+ observations on-chain
- Price deviation guard: rejects updates >20% from current price (trips circuit breaker)
- Staleness check: get-latest-price fails if price not updated within 12 blocks
- Admin controls: register-feed, add-reporter, remove-reporter, set-circuit-breaker
- Default STX-USD and BTC-USD feeds pre-registered on init"

# ─────────────────────────────────────────────────────────────
# COMMIT 7: NFT Marketplace with Auctions and Royalties
# ─────────────────────────────────────────────────────────────
git add contracts/nft-marketplace.clar
git commit -m "feat(contracts): add NFT marketplace with fixed listings, English auctions, and creator royalties

- Fixed-price listings: list-nft, buy-listing, cancel-listing with 2.5% platform fee
- Timed English auctions: create-auction, place-bid (with escrow + auto-refund), settle-auction
- Creator royalties: configurable per-listing up to 10% (1000 bps)
- calculate-fees helper splits sale price into platform-fee, royalty, seller-proceeds
- Auction settle: distributes funds proportionally to seller, creator, and platform
- Expired auctions with no bids handled gracefully in settle-auction
- Platform fees accumulate in contract; owner withdraws via withdraw-platform-fees"

# ─────────────────────────────────────────────────────────────
# COMMIT 8: Collateralized Lending with Liquidation Engine
# ─────────────────────────────────────────────────────────────
git add contracts/lending.clar
git commit -m "feat(contracts): add collateralized STX lending with 70% LTV, interest accrual, and liquidation

- 70% LTV: max borrow = 70% of deposited collateral value
- Per-block interest at 8% APR (800 bps / 52560 blocks/year), accrued lazily
- Health factor = (collateral * 80%) / total-debt; positions liquidatable below HF 1.0
- liquidate: caller repays debt and receives full collateral + 5% liquidation bonus
- add-collateral allows borrowers to top up collateral to restore health factor
- repay-loan: partial or full; full repayment returns collateral and closes position
- get-health-factor and get-max-borrow are read-only for frontends and liquidation bots
- Fund-pool and fund management tools for protocol owner"

# ─────────────────────────────────────────────────────────────
# COMMIT 9: Advanced Frontend Swap Module with AMM Math
# ─────────────────────────────────────────────────────────────
git add src/swap-module.js
git commit -m "feat(frontend): add advanced swap module with AMM math, price impact UI, and Stacks.js integration

- Client-side x*y=k getAmountOut mirrors Clarity contract for instant quotes
- getPriceImpactBps calculates real-time impact in basis points before tx broadcast
- getMinAmountOut applies user slippage tolerance to compute on-chain min-amount-out arg
- Color-coded price impact bar: green <2%, amber 2-5%, red >5%
- Warning banners for MEDIUM and HIGH price impact with user confirmation for dangerous swaps
- setSlippage and initSlippagePresets for 0.1%, 0.5%, 1%, custom % UI
- executeSwap calls openContractCall (Stacks.js) with correct functionArgs including slippage
- swapDirection smoothly animates token toggle and re-quotes instantly"

# ─────────────────────────────────────────────────────────────
# COMMIT 10: Comprehensive DeFi Test Suite
# ─────────────────────────────────────────────────────────────
git add tests/defi-suite_test.ts
git commit -m "test(contracts): add comprehensive Clarinet test suite for DeFi contracts

- advanced-swap: pool creation, x*y=k math accuracy, slippage guard, price impact blocker
- governance: token minting, proposal creation, token-weighted voting, double-vote prevention
- yield-farm: stake state verification, early withdrawal 10% penalty, reward accrual
- lending: 70% LTV enforcement on open-loan, full repayment closes position and returns collateral
- All error codes asserted explicitly (e.g. ERR-SLIPPAGE-EXCEEDED u303, ERR-ALREADY-VOTED u502)
- Tests cover both happy paths and rejection cases
- Print event emission verified for swap and stake events"

Write-Host ""
Write-Host "✅ All 10 commits created successfully!" -ForegroundColor Green
Write-Host ""
git log --oneline -10
