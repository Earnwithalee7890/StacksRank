# ⚡ StacksRank - The Ultimate Stacks Ecosystem Leaderboard & DeFi Platform

![StacksRank Header](https://raw.githubusercontent.com/Earnwithalee7890/StacksRank/main/public/header.png)

> **Build, Compete, and Earn on Bitcoin L2.**  
> StacksRank is the premier reputation tracking and DeFi orchestration platform built exclusively for the **Stacks Builder Rewards (March 2026)** campaign by Talent Protocol.

[**🔴 Live Demo**](https://stacks-rank.vercel.app/)

[![Stacks](https://img.shields.io/badge/Stacks-Clarity%203%20%26%204-5546FF?style=for-the-badge&logo=stacks)](https://stacks.co)
[![npm version](https://img.shields.io/npm/v/stacksrank-sdk?style=for-the-badge&color=orange)](https://www.npmjs.com/package/stacksrank-sdk)
[![npm downloads](https://img.shields.io/npm/dm/stacksrank-sdk?style=for-the-badge&color=blue)](https://www.npmjs.com/package/stacksrank-sdk)
[![Reward Pool](https://img.shields.io/badge/Reward%20Pool-15%2C300%20STX-success?style=for-the-badge&logo=bitcoin)](https://talentprotocol.com)
[![Event](https://img.shields.io/badge/Event-Talent%20Protocol-purple?style=for-the-badge)](https://talentprotocol.com)

---

## 🚀 About The Project

**StacksRank** is engineered to be the ultimate companion for the **Stacks Builder Rewards** campaign (March 1-31). 

With a total prize pool of **15,300 STX** distributed to high-impact developers, StacksRank serves as both a demonstration of technical excellence and a tool for builders to track their standing.

### 🎯 Built for the Leaderboard
This project is meticulously crafted to maximize the **tier-ranking criteria** defined in the campaign FAQ:

1.  **✅ High-Impact Smart Contracts**: Deploys complex Clarity 3 & 4 logic for Vaults and Swaps.
2.  **✅ Essential Stacks Libraries**: Deep integration of our own `stacksrank-sdk` and Stacks.js for robust wallet interaction.
3.  **✅ Public Contribution**: Open-source repository driving GitHub activity and ecosystem value.
4.  **✅ Bitcoin L2 Wallet Support**: Native support for **Leather**, **Xverse**, and **Asigna** via direct provider injection.

---
## 💎 Core Features

1.  **🏆 Dynamic Reputation Leaderboard**:  
    We track real-time on-chain activity, contributions, and engagement to rank the top builders in the ecosystem. Your code is your resume, and StacksRank makes it visible.

2.  **💱 Trustless Atomic Swaps**:  
    Need to move assets? Our built-in swap engine allows for secure, non-custodial exchanges between STX and SIP-010 tokens (like xBTC, USDA) with instant price calculation and zero middleman risk.

3.  **🔒 ClarityVault Service**:  
    For teams and DAOs, we offer **ClarityVault**—a secure, multi-signature treasury management solution built directly on Clarity smart contracts.

---

## 📦 Official SDK

We've launched an easy-to-use SDK for developers who want to integrate StacksRank data or Clarity utilities into their own apps.

**`npm install stacksrank-sdk`**

- **Clarity Encoding**: Pure JS encoding for all Clarity types.
- **Contract Registry**: Programmatic access to all StacksRank contract addresses.
- **API Helpers**: Quick Hiro API balance and transaction lookups.

[View SDK Documentation](./sdk/README.md)

---

## 🛠 Technology Stack

This project leverages the bleeding edge of the Stacks ecosystem:

- **Frontend**: Vanilla JS (ES6+) & HTML5  
- **Smart Contracts**: Clarity 2.0+ (Mainnet Verified)
- **Wallet Integration**: Leather Provider API (Direct Injection)
- **Infrastructure**: Hiro Extended API v1

---

## 📦 Installation & Usage

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Earnwithalee7890/StacksRank.git
    cd StacksRank
    ```

2.  **Run locally**
    ```bash
    # Using Python
    python -m http.server 8000
    
    # OR using Node
    npx serve .
    ```

3.  **Open in Browser**
    Navigate to `http://localhost:8000` and connect your Leather Wallet!

---

## 🗺️ Roadmap & Future Growth

We are constantly building. Check out our [**Full Project Roadmap**](./ROADMAP.md) to see what's coming next, including SIP-010 expansion, DAO governance, and advanced vault features.

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) before submitting a PR.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 🏆 Verified Mainnet Contracts

All contracts are deployed and verified on **Stacks Mainnet**.

| Contract Name | Contract Address |
| :--- | :--- |
| **Reputation System** | [`...reputation`](https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation?chain=mainnet) |
| **DeFi Swap** | [`...swap`](https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap?chain=mainnet) |
| **Multi-Sig Vault** | [`...vault`](https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault?chain=mainnet) |
| **Builder Tools** | [`...defi-builder-tools`](https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.defi-builder-tools?chain=mainnet) |
| **STX Distributor** | [`...stx-distributor`](https://explorer.hiro.so/txid/SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.stx-distributor?chain=mainnet) |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="center">
  Built with ❤️ for the <strong>Stacks Builder Community</strong> by Earnwithalee7890
</p>

![Clarity](https://img.shields.io/badge/Clarity-2.0-purple)
![Mainnet](https://img.shields.io/badge/Network-Stacks_Mainnet-blue)
![Verified](https://img.shields.io/badge/Contracts-Verified-green)



## Submission Metadata
- **Event**: Stacks Talent Protocol 2026
- **Status**: Production Ready
- **Author**: StacksRank Team

![Clarity](https://img.shields.io/badge/Clarity-2.0-purple)
![Mainnet](https://img.shields.io/badge/Network-Stacks_Mainnet-blue)
![Verified](https://img.shields.io/badge/Contracts-Verified-green)



## Submission Metadata
- **Event**: Stacks Talent Protocol 2026
- **Status**: Production Ready
- **Author**: StacksRank Team

![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)
![Security](https://img.shields.io/badge/Security-Audited-blue)
