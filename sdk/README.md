# StacksRank SDK

Official SDK for interacting with [StacksRank](https://github.com/Earnwithalee7890/StacksRank) smart contracts on the Stacks blockchain.

## Features

- 🔐 **Clarity Value Encoding** — Encode string-ascii, uint, int, bool, principal, and buffer types
- 📋 **Contract Registry** — All deployed StacksRank contract addresses and functions
- 🔗 **Wallet Helpers** — Connect to Leather wallet and call contracts
- 🌐 **Hiro API Utilities** — Query balances, transactions, and read-only contract calls
- ⚡ **Zero Dependencies** — Pure JavaScript, works in Node.js and browsers

## Installation

```bash
npm install stacksrank-sdk
```

## Quick Start

```javascript
const { encoding, contracts, api } = require('stacksrank-sdk');

// Encode Clarity values
const name = encoding.encodeStringAscii("MyBuilder");
const amount = encoding.encodeUint(1000000);

// Get contract addresses
const addresses = contracts.getContractAddresses();
console.log(addresses.FEB_CHECKIN);
// → "SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.feb-builder-check-in"

// Check a balance
const { stx } = await api.getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7");
console.log(`Balance: ${stx} STX`);
```

## Wallet Connection (Browser)

```javascript
const { wallet } = require('stacksrank-sdk');

// Check if wallet is installed
const { available, provider } = wallet.detectWallet();

// Connect and get address
const address = await wallet.connectWallet();
console.log(`Connected: ${wallet.formatAddress(address)}`);

// Call a contract
await wallet.callContract({
    contract: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.feb-builder-check-in',
    functionName: 'check-in',
    functionArgs: [],
    network: 'mainnet'
});
```

## API Reference

### Encoding

| Function | Description |
|---|---|
| `encodeStringAscii(str)` | Encode ASCII string to Clarity hex |
| `encodeStringUtf8(str)` | Encode UTF-8 string to Clarity hex |
| `encodeUint(val)` | Encode unsigned int128 to Clarity hex |
| `encodeInt(val)` | Encode signed int128 to Clarity hex |
| `encodeBool(val)` | Encode boolean to Clarity hex |
| `encodePrincipal(addr)` | Encode Stacks address to Clarity hex |
| `encodeBuffer(data)` | Encode raw buffer to Clarity hex |

### Contracts

| Function | Description |
|---|---|
| `CONTRACTS` | Full contract registry with addresses and functions |
| `DEPLOYER` | The deployer principal address |
| `getContractAddresses()` | Get a flat map of contract addresses |

### Wallet

| Function | Description |
|---|---|
| `detectWallet()` | Check if Leather/Hiro wallet is installed |
| `connectWallet()` | Connect and return the STX address |
| `callContract(opts)` | Call a smart contract via wallet |
| `formatAddress(addr)` | Truncate address for display |

### API

| Function | Description |
|---|---|
| `getBalance(addr, network?)` | Get STX and token balances |
| `getTransactions(addr, opts?)` | Fetch recent transactions |
| `getTransactionStatus(txId)` | Check transaction status |
| `readContract(addr, name, fn)` | Call a read-only contract function |
| `getBlockHeight(network?)` | Get current block height |
| `microToStx(val)` | Convert microSTX to STX |
| `stxToMicro(val)` | Convert STX to microSTX |

## Deployed Contracts

| Contract | Address |
|---|---|
| Reputation | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation` |
| Swap | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap` |
| Vault | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault` |
| Check-in | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.feb-builder-check-in` |
| Builder Tools | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.defi-builder-tools` |
| Fee Distributor | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.direct-fee-distributor` |
| STX Distributor | `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.stx-distributor` |

## License

MIT © [Earnwithalee7890](https://github.com/Earnwithalee7890)
