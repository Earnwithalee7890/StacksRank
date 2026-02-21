# Stacks Builder Rewards: February 2026

## Overview
**Goal**: Earn rewards for building on Stacks.  
**Rewards Pool**: 15,000 $STX  
**Distribution Date**: March 3, 2026  
**Activity Tracking**: Feb 1 - Feb 28, 2026  

## Eligibility
To be eligible, you must:
1.  **Connect Wallet**: Connect a Bitcoin L2 wallet (Leather, Xverse, Asigna, Fordefi) to `talent.app`.
2.  **Connect GitHub**: Connect your GitHub profile on `talent.app`.
3.  **Compliance**: Not be on sanctions lists (OFAC, etc.).

## Rankings & Rewards
Rewards are distributed based on a leaderboard.

### Reward Tiers (50 Winners Total)
*   **Tier 1 (Top 10)**: Share 50% of the pool equally (7,500 STX / 10 = **750 STX each**).
*   **Tier 2 (Next 15)**: Share 25% of the pool (3,750 STX / 15 = **250 STX each**).
*   **Tier 3 (Next 25)**: Share 25% of the pool (3,750 STX / 25 = **150 STX each**).

### Ranking Criteria
Your position is determined by activity across:
1.  **Smart Contracts**: Activity and impact of contracts deployed on Stacks.
2.  **Library Usage**: Use of `@stacks/connect` and `@stacks/transactions` in repos.
3.  **GitHub**: Contributions to public repositories.

## Strategy for this Repo
To maximize ranking:
*   **Contract**: Deployed `feb-builder-check-in.clar` (Contract Principal: `SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.feb-builder-check-in`).
*   **Interaction**: The `check-in` function generates transaction volume (0.02 STX fee).
*   **Code**: This repo uses `@stacks/connect` and `@stacks/transactions`.
*   **Commits**: Regular commits to this public repo count towards the score.

## Contract Details: `feb-builder-check-in`
A specialized contract created for this event to boost on-chain activity.

*   **Function**: `check-in`
    *   **Cost**: 0.02 STX (transferred to contract).
    *   **Purpose**: records activity on-chain.
*   **Function**: `withdraw-fees`
    *   **Access**: Owner only.
    *   **Purpose**: Retrieve all collected fees after the event.

## Deployment
Deploy this contract using Clarinet or the Stacks explorer sandbox.
Once deployed, verify the contract on the explorer to boost "verified contracts" score.
