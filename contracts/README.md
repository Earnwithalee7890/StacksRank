# StacksRank Smart Contracts

This directory contains the Clarity smart contracts that power the StacksRank ecosystem.

## Contract Overview

### Core Ecosystem
- **`simple-reputation.clar`**: Tracks builder reputation and activity.
- **`simple-swap.clar`**: Basic atomic swap engine for STX and SIP-010.
- **`simple-vault.clar`**: Multi-signature vault for treasury management.
- **`governance.clar`**: DAO framework for protocol decisions and parameter updates.
- **`access-control.clar`**: RBAC system for managing administrative permissions.

### Advanced DeFi
- **`advanced-swap.clar`**: Full AMM with liquidity pools and slippage protection.
- **`lending.clar`**: Collateralized lending protocol with liquidation mechanics.
- **`yield-farm.clar`**: Reward distribution for liquidity providers.
- **`flash-loan.clar`**: Uncollateralized lending for high-efficiency arbitrage.
- **`price-oracle.clar`**: Multi-source oracle for real-time asset pricing.

### Builder Tools
- **`defi-builder-tools.clar`**: Registry and status updates for ecosystem builders.
- **`stx-distributor.clar`**: Daily STX reward distribution logic.
- **`feb-builder-check-in.clar`**: Daily activity tracker for the rewards campaign.
- **`daily-distributor.clar`**: Automated distribution of participation rewards.

### Utility & Fun
- **`nft-marketplace.clar`**: Decentralized exchange for SIP-009 assets.
- **`lottery.clar`**: Provably fair on-chain lottery system.
- **`flip-coin.clar`**: Simple betting game using VRF or block headers.
- **`guestbook.clar`**: Public registry for visitor signatures and messages.


## Development

### Tools
- **Clarinet**: Used for testing and local deployment.
- **Hiro Explorer**: For mainnet/testnet verification.

### Testing
Run contract tests using Clarinet:
```bash
clarinet test
```

### Standards
- **SIP-010**: All tokens follow the SIP-010 fungible token standard.
- **SIP-009**: All NFTs follow the SIP-009 non-fungible token standard.
