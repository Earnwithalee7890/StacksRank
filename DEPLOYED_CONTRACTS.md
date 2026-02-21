# 🎉 CONTRACTS DEPLOYED ON MAINNET!

## ✅ **Deployment Complete!**

All contracts are now live on Stacks MAINNET!

---

## 📝 **Deployed Contract Addresses:**

### **Reputation Contract** ⭐
```
SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation
```

**Functions:**
- `register-user` - Register new user
- `daily-check-in` - Daily check-in for points
- `add-contribution` - Log contributions
- `get-user-info` - Get user stats
- `get-total-users` - Total registered users
- `get-leaderboard-stats` - Leaderboard stats

**Explorer:**
https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation?chain=mainnet

---

### **Swap Contract** 💱
```
SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap
```

**Functions:**
- `create-swap` - Create new swap offer
- `accept-swap` - Accept existing swap
- `cancel-swap` - Cancel your swap
- `get-swap` - View swap details
- `get-stats` - Swap statistics
- `calculate-fee` - Calculate swap fee

**Explorer:**
https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap?chain=mainnet

---

### **Vault Contract** 🔒
```
SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault
```

**Functions:**
- `create-vault` - Create multi-sig vault
- `deposit` - Deposit STX to vault
- `propose-withdrawal` - Propose withdrawal
- `sign-proposal` - Sign withdrawal proposal
- `get-vault` - View vault details
- `get-proposal` - View proposal details
- `is-signer` - Check if address is signer

**Explorer:**
https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault?chain=mainnet

---

### **Builder Tools (Feb Event)** 🛠️
```
SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.defi-builder-tools
```
and
```
SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.feb-builder-check-in
```

**Explorer:**
https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.defi-builder-tools?chain=mainnet

---

## 🧪 **Interact on Mainnet:**

### **1. Register User (Reputation)**
```clarity
(contract-call? 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation register-user)
```

### **2. Daily Check-In (Reputation)**
```clarity
(contract-call? 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation daily-check-in)
```

### **3. Builder Check-In (Event Special)**
```clarity
(contract-call? 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.feb-builder-check-in check-in)
```

---

## 🔗 **Links:**

### **Your Mainnet Contracts:**
- Reputation: https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation?chain=mainnet
- Swap: https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap?chain=mainnet
- Vault: https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault?chain=mainnet
- Builder Tools: https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.defi-builder-tools?chain=mainnet

---

## 🎮 **Frontend Integration:**

Your `src/contracts.js` is already configured for Mainnet!

```javascript
import { CONTRACT_ADDRESSES } from './src/contracts.js';
// NETWORK is set to 'mainnet'
```
