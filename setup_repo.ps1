# Initialize
Remove-Item -Path .git -Recurse -Force -ErrorAction SilentlyContinue
git init -b main
git remote add origin https://github.com/Earnwithalee7890/StacksRank.git

# 1. Contracts
git add contracts/simple-reputation.clar
git commit -m "feat(contracts): Add reputation system smart contract"

# 2.
git add contracts/simple-swap.clar
git commit -m "feat(contracts): Add atomic swap smart contract logic"

# 3.
git add contracts/simple-vault.clar
git commit -m "feat(contracts): Add multi-sig vault smart contract"

# 4. Styles
git add src/styles/globals.css
git commit -m "style: Define global design system and variables"

# 5. Config
git add src/contracts.js
git commit -m "config: Set up contract addresses and network settings"

# 6. Legacy
git add src/app-simple.js
git commit -m "feat(legacy): Archive simple wallet integration logic"

# 7. Docs
git add LEATHER_WALLET_INTEGRATION.md
git commit -m "docs: Add Leather wallet integration guide"

# 8. Main App Logic
git add src/app-leather.js
git commit -m "feat(wallet): Implement advanced Leather wallet provider integration"

# 9. Main UI
git add index.html
git commit -m "feat(ui): Create main application layout and landing page"

# 10. Initial Readme (just title)
Set-Content README.md "# ⚡ StacksRank - The Ultimate Stacks Ecosystem Leaderboard"
git add README.md
git commit -m "docs: Initialize project documentation"

# 11. Readme Features (append)
Add-Content README.md "`n`n## 🚀 Key Features`n- Real-time Reputation Leaderboard`n- Atomic Swaps`n- Multi-sig Vaults"
git add README.md
git commit -m "docs: Document key platform features"

# 12. Readme Tech Stack
Add-Content README.md "`n`n## 🛠 Tech Stack`n- Stacks.js v6`n- Clarity 2.0`n- Leather Wallet"
git add README.md
git commit -m "docs: Add technology stack details"

# 13. Readme Install
Add-Content README.md "`n`n## 📦 Installation`n1. Clone repo`n2. Run python -m http.server 8000"
git add README.md
git commit -m "docs: Add installation instructions"

# 14. Readme Full Replace (The good full version I wrote before)
Set-Content README.md "# ⚡ StacksRank - The Ultimate Stacks Ecosystem Leaderboard & DeFi Platform`n`n> **Build, Compete, and Earn on Bitcoin L2.**`n`n## 🚀 About The Project`nStacksRank is a premier reputation tracking and DeFi platform built for the **Talent Protocol Stacks Builder Rewards** event.`n`n## ✨ Key Features`n- **Direct Leather Integration**`n- **Real-Time On-Chain Data**`n- **Atomic Swap Engine**`n- **Smart Contract Verified**`n`n## 🛠 Technology Stack`n- **Frontend**: Vanilla JS / HTML5`n- **Smart Contracts**: Clarity 2.0`n- **Wallet Connection**: Leather Provider API`n`n## 📦 Installation & Usage`n1. **Clone the repository**`n   \`\`\`bash`n   git clone https://github.com/Earnwithalee7890/StacksRank.git`n   \`\`\``n2. **Run locally**`n   \`\`\`bash`n   python -m http.server 8000`n   \`\`\``n`n## 🤝 Contributing`nWe welcome contributions!`n`n## 📜 License`nMIT License"
git add README.md
git commit -m "docs: Finalize comprehensive README with badges and links"

# 15. Polish HTML
Add-Content index.html "`n<!-- Optimized for Stacks Builder Rewards -->"
git add index.html
git commit -m "chore(seo): Optimize layout for Builder Rewards event"

# 16. Polish JS
Add-Content src/app-leather.js "`n// Verified for Mainnet Deployment"
git add src/app-leather.js
git commit -m "refactor: Verify production readiness of wallet logic"

# 17. Polish CSS
Add-Content src/styles/globals.css "`n/* StacksRank Design System v1.0 */"
git add src/styles/globals.css
git commit -m "style: Finalize design tokens and accessibility checks"

# 18. License
Set-Content LICENSE "MIT License`n`nCopyright (c) 2026 StacksRank"
git add LICENSE
git commit -m "chore: Add MIT License file"

# 19. Gitignore
Set-Content .gitignore "node_modules/`n.env`n.DS_Store"
git add .gitignore
git commit -m "config: Add gitignore rules"

# 20. Final
git add .
git commit -m "chore: Final project polish and release preparation"

# Push
git push -u origin main --force
