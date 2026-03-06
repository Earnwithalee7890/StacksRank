# StacksRank Deployment Guide

## Prerequisites

1. **Stacks Wallet** with STX for transaction fees
2. **Clarinet** installed globally
3. **Node.js** 16+ for frontend

## Smart Contract Deployment

### Step 1: Install Clarinet

```bash
npm install -g @hirosystems/clarinet
```

### Step 2: Verify Contracts Compile

```bash
cd f:/StacksRank
clarinet check
```

All three contracts should compile without errors.

### Step 3: Generate Mainnet Deployment

```bash
clarinet deployments generate --mainnet
```

This creates `deployments/mainnet.yaml`

### Step 4: Configure Deployment

Edit `deployments/mainnet.yaml`:

```yaml
---
id: 0
name: StacksRank Mainnet
network: mainnet
stacks-node: https://stacks-node-api.mainnet.stacks.co
bitcoin-node: http://blockstack:blockstacksystem@bitcoin.blockstack.com:8332

plan:
  batches:
    - id: 0
      transactions:
        - contract-publish:
            contract-name: stacksrank-reputation
            expected-sender: YOUR_MAINNET_ADDRESS
            cost: 50000
            path: contracts/stacksrank-reputation.clar
            anchor-block-only: true
        - contract-publish:
            contract-name: stx-swap-atomic
            expected-sender: YOUR_MAINNET_ADDRESS
            cost: 50000
            path: contracts/stx-swap-atomic.clar
            anchor-block-only: true
        - contract-publish:
            contract-name: clarity-vault-multi-sig
            expected-sender: YOUR_MAINNET_ADDRESS
            cost: 50000
            path: contracts/clarity-vault-multi-sig.clar
            anchor-block-only: true
```

Replace `YOUR_MAINNET_ADDRESS` with your actual Stacks address.

### Step 5: Deploy to Mainnet

```bash
clarinet deployments apply -p deployments/mainnet.yaml
```

### Step 6: Verify on Hiro Explorer

1. Visit https://explorer.hiro.so/
2. Search for your contract addresses
3. Click "Verify Contract"
4. Upload source code from `contracts/` folder
5. Add README documentation

## Contract Addresses

After deployment, update these:

- **Reputation Contract**: `SP[YOUR_ADDRESS].stacksrank-reputation`
- **Swap Contract**: `SP[YOUR_ADDRESS].stx-swap-atomic`
- **Vault Contract**: `SP[YOUR_ADDRESS].clarity-vault-multi-sig`

## Testing Deployed Contracts

### Test Reputation Contract

```clarity
;; Register as user
(contract-call? .stacksrank-reputation register-user)

;; Perform daily check-in
(contract-call? .stacksrank-reputation daily-check-in)

;; Add contribution
(contract-call? .stacksrank-reputation add-ecosystem-contribution 
  "stacks-network/docs" 
  "documentation" 
  u50)
```

### Test Swap Contract

```clarity
;; Create swap proposal
(contract-call? .stx-swap-atomic create-swap-proposal
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7  ;; recipient
  u1000000  ;; 1 STX
  u250      ;; 0.00025 BTC equivalent
  .token-stx
  .token-xbtc
  u144)     ;; expires in ~1 day
```

### Test Vault Contract

```clarity
;; Create multi-sig vault
(contract-call? .clarity-vault-multi-sig create-vault
  (list 'SP2J6... 'SP3FB... 'SP1P7...)  ;; signers
  u2                                      ;; require 2 signatures
  u1008)                                  ;; 7 day timelock

;; Deposit to vault
(contract-call? .clarity-vault-multi-sig deposit-to-vault
  u1              ;; vault-id
  u10000000)      ;; 10 STX
```

## Frontend Deployment

### Option 1: Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Option 2: Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=./
```

### Option 3: GitHub Pages

1. Push code to GitHub
2. Go to repo Settings → Pages
3. Select branch and folder
4. Save

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_REPUTATION_CONTRACT=SP[YOUR_ADDRESS].stacksrank-reputation
NEXT_PUBLIC_SWAP_CONTRACT=SP[YOUR_ADDRESS].stx-swap-atomic
NEXT_PUBLIC_VAULT_CONTRACT=SP[YOUR_ADDRESS].clarity-vault-multi-sig
NEXT_PUBLIC_STACKS_API=https://stacks-node-api.mainnet.stacks.co
```

## Post-Deployment Checklist

- [ ] All 3 contracts deployed to mainnet
- [ ] Contracts verified on Hiro Explorer
- [ ] Contract addresses updated in README.md
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] Test all contract functions
- [ ] Monitor first user transactions
- [ ] Update Talent Protocol profile with deployment info

## Troubleshooting

### Contract Deployment Fails

- Check STX balance for fees (need ~0.5 STX)
- Verify mainnet node is accessible
- Check contract syntax with `clarinet check`

### Contract Not Found

- Wait 2-3 minutes for blockchain confirmation
- Check explorer with transaction ID
- Verify correct network (mainnet vs testnet)

### Frontend Can't Connect

- Check Leather wallet is on mainnet
- Verify contract addresses in code
- Enable browser console for errors

## Monitoring

Track your deployment:

- **Hiro Explorer**: https://explorer.hiro.so/
- **Stacks API**: Check contract calls and transactions
- **Analytics**: Monitor user adoption

## Security Notes

- Never commit private keys
- Use hardware wallet for mainnet deployments
- Test thoroughly on testnet first
- Audit contracts before mainnet deployment
- Set up monitoring for unusual activity

---

**Ready to deploy!** Follow this guide step-by-step for successful mainnet launch. 🚀

## Deployment Checklist
- [ ] Run test suite
- [ ] Verify contract endpoints against Mainnet
- [ ] Execute trial transaction

