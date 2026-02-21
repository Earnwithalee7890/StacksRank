# Commit Script - 7 Strong Commits for 30 Clarity Contracts
Set-Location "f:\StacksRank"

# Commit 1: Core utility contracts
git add contracts/simple-counter.clar contracts/hello-world.clar contracts/simple-storage.clar contracts/simple-oracle.clar
git commit -m "feat(contracts): add core utility contracts - counter, hello-world, storage, oracle

- simple-counter: increment/decrement/reset counter with read-only getter
- hello-world: greeting messages with configurable message storage
- simple-storage: per-user key-value string storage with delete support
- simple-oracle: owner-managed price feed with block-height timestamp

These foundational contracts demonstrate basic Clarity patterns including
data-var usage, map operations, and owner-only access control."

# Commit 2: Financial contracts
git add contracts/tip-jar.clar contracts/piggy-bank.clar contracts/donation-tracker.clar contracts/escrow.clar
git commit -m "feat(contracts): add financial utility contracts - tip-jar, piggy-bank, donations, escrow

- tip-jar: accept STX tips with owner withdrawal and balance tracking
- piggy-bank: deposit savings with owner-only break-bank withdrawal
- donation-tracker: track per-donor amounts with total and donor count stats
- escrow: two-party escrow with buyer release and seller refund mechanisms

Implements STX transfer patterns with as-contract for secure fund management."

# Commit 3: Community and social contracts
git add contracts/simple-poll.clar contracts/guestbook.clar contracts/profile.clar contracts/bookmarks.clar contracts/announcements.clar
git commit -m "feat(contracts): add community and social contracts - poll, guestbook, profile, bookmarks, announcements

- simple-poll: yes/no voting with duplicate vote prevention
- guestbook: numbered on-chain message entries with signer tracking
- profile: user-managed name and bio with delete capability
- bookmarks: per-user on-chain link saving with title metadata
- announcements: owner-only public announcement board with timestamps

Social interaction patterns with per-user data isolation via maps."

# Commit 4: Membership and access contracts
git add contracts/simple-membership.clar contracts/whitelist.clar contracts/access-control.clar contracts/badges.clar contracts/referral.clar
git commit -m "feat(contracts): add membership and access control contracts

- simple-membership: join/leave with active status and member count
- whitelist: owner-managed address whitelist with size tracking
- access-control: role-based access with string roles per principal
- badges: owner awards named badges with per-user badge count
- referral: self-referral prevention with referrer tracking and counts

Implements identity and permission patterns for dApp user management."

# Commit 5: DeFi building blocks
git add contracts/simple-token.clar contracts/simple-nft.clar contracts/staking.clar contracts/subscription.clar
git commit -m "feat(contracts): add DeFi building blocks - token, NFT, staking, subscription

- simple-token: fungible token with owner-only minting and free transfers
- simple-nft: non-fungible token with auto-increment IDs and transfers
- staking: stake STX with block-height duration tracking
- subscription: block-based paid subscription with expiry checks

Core DeFi primitives using define-fungible-token and define-non-fungible-token."

# Commit 6: Game and incentive contracts
git add contracts/flip-coin.clar contracts/lottery.clar contracts/leaderboard.clar contracts/todo-list.clar
git commit -m "feat(contracts): add game and incentive contracts - flip-coin, lottery, leaderboard, todo-list

- flip-coin: block-height-based coin flip game with win/loss stats
- lottery: ticket purchase with owner-selected winner and prize pool
- leaderboard: score submission with automatic top scorer tracking
- todo-list: per-user task management with completion status

Gamification and productivity patterns for user engagement."

# Commit 7: Security and advanced patterns
git add contracts/timelock.clar contracts/deadman-switch.clar contracts/multisig.clar contracts/rate-limiter.clar
git commit -m "feat(contracts): add security and advanced pattern contracts

- timelock: lock STX for configurable block duration with unlock guard
- deadman-switch: beneficiary claims funds after owner inactivity timeout
- multisig: 2-of-2 approval workflow for secure fund management
- rate-limiter: cooldown-based action throttling per user

Advanced security patterns including time-locks, dead-man switches,
multi-signature approval, and rate limiting for production dApps."

Write-Host ""
Write-Host "All 7 commits created successfully!" -ForegroundColor Green
Write-Host ""
git log --oneline -7
