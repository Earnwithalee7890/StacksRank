# 🛠️ StacksRank DeFi Builder Tools API

The DeFi Builder Tools contract (`...defi-builder-tools`) provides a suite of on-chain utilities for managing builder reputation and community interactions.

## 🔗 Contract Information

- **Mainnet Address**: `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT`
- **Network**: Stacks Mainnet

## 💎 Public Functions

### `register-builder (name (string-ascii 80), profile-url (string-ascii 200))`

Joins the StacksRank ecosystem as a verified builder. 

- **Fee**: `20,000 uSTX` (0.02 STX)
- **Returns**: `(ok true)` or `(err u101)` (Already registered)

### `update-status (new-status (string-ascii 140))`

Broadcasts a status update to the community leaderboard.

- **Fee**: `10,000 uSTX` (0.01 STX)
- **Returns**: `(ok true)` or `(err u102)` (Not registered)

### `request-service (service-type (string-ascii 20), details (string-ascii 200))`

Logs a service request for other builders to fulfill.

- **Fee**: `10,000 uSTX` (0.01 STX)
- **Returns**: `(ok true)`

## 🔒 Administrative Functions

### `withdraw-fees (recipient principal)`

Withdraws accumulated protocol fees to a specified address.

- **Restricted**: Contract Owner Only
- **Returns**: `(ok uint)` (Amount withdrawn)

### `update-fees (new-reg-fee uint, new-msg-fee uint)`

Updates the protocol fee prices.

- **Restricted**: Contract Owner Only
- **Returns**: `(ok true)`
