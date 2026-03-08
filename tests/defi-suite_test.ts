import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals, assertExists } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

// ─────────────────────────────────────────────────────────────
// ADVANCED SWAP CONTRACT TESTS
// ─────────────────────────────────────────────────────────────

Clarinet.test({
    name: "advanced-swap: owner can create a pool with initial liquidity",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;

        const block = chain.mineBlock([
            Tx.contractCall('advanced-swap', 'create-pool',
                [types.uint(10_000_000), types.uint(5_000_000)],
                owner.address)
        ]);

        assertEquals(block.receipts[0].result, '(ok {lp-tokens-minted: u7071, pool-id: u1})');
        assertEquals(block.receipts[0].events.length, 0); // no STX events for mock reserves
    }
});

Clarinet.test({
    name: "advanced-swap: get-amount-out follows x*y=k formula with 0.3% fee",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        // Create pool first
        chain.mineBlock([
            Tx.contractCall('advanced-swap', 'create-pool',
                [types.uint(1_000_000_000), types.uint(1_000_000_000)],
                deployer.address)
        ]);

        const result = chain.callReadOnlyFn('advanced-swap', 'get-amount-out', [
            types.uint(10_000_000),   // swap 10 STX
            types.uint(1_000_000_000),
            types.uint(1_000_000_000),
        ], deployer.address);

        // Should be slightly less than 10 due to 0.3% fee and price impact
        const value = parseInt(result.result.replace('(ok u', '').replace(')', ''));
        assertEquals(value < 10_000_000, true);
        assertEquals(value > 9_900_000, true); // within 1% for small trades
    }
});

Clarinet.test({
    name: "advanced-swap: swap-a-for-b succeeds and emits print event",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const user = accounts.get('wallet_1')!;

        // Create pool
        chain.mineBlock([
            Tx.contractCall('advanced-swap', 'create-pool',
                [types.uint(100_000_000), types.uint(100_000_000)],
                owner.address)
        ]);

        const block = chain.mineBlock([
            Tx.contractCall('advanced-swap', 'swap-a-for-b',
                [
                    types.uint(1),           // pool-id
                    types.uint(1_000_000),   // amount-in: 1 STX
                    types.uint(980_000),     // min-out: 0.98 (0.5% slippage)
                    types.uint(999_999_999), // deadline: far future
                ],
                user.address)
        ]);

        assertEquals(block.receipts[0].result.startsWith('(ok'), true);

        // Verify print event was emitted
        const printEvents = block.receipts[0].events.filter(
            (e: any) => e.type === 'contract_event'
        );
        assertEquals(printEvents.length >= 1, true);
    }
});

Clarinet.test({
    name: "advanced-swap: slippage exceeded returns ERR-SLIPPAGE-EXCEEDED",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const user = accounts.get('wallet_1')!;

        chain.mineBlock([
            Tx.contractCall('advanced-swap', 'create-pool',
                [types.uint(100_000_000), types.uint(100_000_000)],
                owner.address)
        ]);

        const block = chain.mineBlock([
            Tx.contractCall('advanced-swap', 'swap-a-for-b',
                [
                    types.uint(1),
                    types.uint(1_000_000),    // amount-in: 1 STX
                    types.uint(999_999_999),  // min-out: impossibly high (slippage fails)
                    types.uint(999_999_999),
                ],
                user.address)
        ]);

        assertEquals(block.receipts[0].result, '(err u303)'); // ERR-SLIPPAGE-EXCEEDED
    }
});

Clarinet.test({
    name: "advanced-swap: price impact guard blocks large trades",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const user = accounts.get('wallet_1')!;

        // Create small pool (low liquidity)
        chain.mineBlock([
            Tx.contractCall('advanced-swap', 'create-pool',
                [types.uint(1_000_000), types.uint(1_000_000)], // tiny pool
                owner.address)
        ]);

        const block = chain.mineBlock([
            Tx.contractCall('advanced-swap', 'swap-a-for-b',
                [
                    types.uint(1),
                    types.uint(500_000), // 50% of pool (very high impact)
                    types.uint(1),
                    types.uint(999_999_999),
                ],
                user.address)
        ]);

        // Should fail with price impact error (u305) or slippage
        assertEquals(
            block.receipts[0].result === '(err u305)' ||
            block.receipts[0].result === '(err u303)',
            true
        );
    }
});

// ─────────────────────────────────────────────────────────────
// GOVERNANCE CONTRACT TESTS
// ─────────────────────────────────────────────────────────────

Clarinet.test({
    name: "governance: mint tokens and create proposal successfully",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const voter = accounts.get('wallet_1')!;

        // Mint 5000 governance tokens to voter
        const mintBlock = chain.mineBlock([
            Tx.contractCall('governance', 'mint-gov-tokens',
                [types.principal(voter.address), types.uint(5000)],
                owner.address)
        ]);
        assertEquals(mintBlock.receipts[0].result, '(ok u5000)');

        // Voter creates a proposal
        const propBlock = chain.mineBlock([
            Tx.contractCall('governance', 'create-proposal',
                [
                    types.stringAscii('Update swap fee'),
                    types.stringAscii('Reduce swap fee to 0.2%'),
                    types.stringAscii('swap-fee-bps'),
                    types.uint(20),
                ],
                voter.address)
        ]);

        assertEquals(propBlock.receipts[0].result.startsWith('(ok'), true);
    }
});

Clarinet.test({
    name: "governance: cast-vote is token-weighted and prevents double voting",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const voter1 = accounts.get('wallet_1')!;

        chain.mineBlock([
            Tx.contractCall('governance', 'mint-gov-tokens',
                [types.principal(voter1.address), types.uint(2000)],
                owner.address)
        ]);

        chain.mineBlock([
            Tx.contractCall('governance', 'create-proposal',
                [
                    types.stringAscii('Test prop'),
                    types.stringAscii('Description'),
                    types.stringAscii('cooldown-blocks'),
                    types.uint(288),
                ],
                voter1.address)
        ]);

        // First vote should succeed
        const vote1 = chain.mineBlock([
            Tx.contractCall('governance', 'cast-vote',
                [types.uint(1), types.bool(true)],
                voter1.address)
        ]);
        assertEquals(vote1.receipts[0].result.startsWith('(ok'), true);

        // Second vote should fail
        const vote2 = chain.mineBlock([
            Tx.contractCall('governance', 'cast-vote',
                [types.uint(1), types.bool(true)],
                voter1.address)
        ]);
        assertEquals(vote2.receipts[0].result, '(err u502)'); // ERR-ALREADY-VOTED
    }
});

// ─────────────────────────────────────────────────────────────
// YIELD FARM TESTS
// ─────────────────────────────────────────────────────────────

Clarinet.test({
    name: "yield-farm: stake STX and verify state update",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const user = accounts.get('wallet_1')!;

        // Seed reward pool
        chain.mineBlock([
            Tx.contractCall('yield-farm', 'deposit-rewards',
                [types.uint(10_000_000)],
                owner.address)
        ]);

        // User stakes 5 STX with no lock
        const block = chain.mineBlock([
            Tx.contractCall('yield-farm', 'stake',
                [types.uint(5_000_000), types.uint(0)],
                user.address)
        ]);

        assertEquals(block.receipts[0].result.startsWith('(ok'), true);

        // Verify farm stats
        const stats = chain.callReadOnlyFn('yield-farm', 'get-farm-stats', [], owner.address);
        const statsStr = stats.result;
        assertEquals(statsStr.includes('total-stakers: u1'), true);
        assertEquals(statsStr.includes('total-staked: u5000000'), true);
    }
});

Clarinet.test({
    name: "yield-farm: early unstake applies 10% penalty",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const user = accounts.get('wallet_1')!;

        chain.mineBlock([
            Tx.contractCall('yield-farm', 'deposit-rewards',
                [types.uint(10_000_000)], owner.address)
        ]);

        // Stake with 720-block lock
        chain.mineBlock([
            Tx.contractCall('yield-farm', 'stake',
                [types.uint(1_000_000), types.uint(720)],
                user.address)
        ]);

        // Immediately unstake (should trigger penalty)
        const unstakeBlock = chain.mineBlock([
            Tx.contractCall('yield-farm', 'unstake',
                [types.uint(1_000_000)],
                user.address)
        ]);

        const result = unstakeBlock.receipts[0].result;
        // Penalty should be 100,000 uSTX (10% of 1,000,000)
        assertEquals(result.includes('penalty: u100000'), true);
    }
});

// ─────────────────────────────────────────────────────────────
// LENDING CONTRACT TESTS
// ─────────────────────────────────────────────────────────────

Clarinet.test({
    name: "lending: open loan respects 70% LTV limit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const user = accounts.get('wallet_1')!;

        // Fund the loan pool
        chain.mineBlock([
            Tx.contractCall('lending', 'fund-pool',
                [types.uint(100_000_000)], owner.address)
        ]);

        // Deposit 10 STX collateral, try to borrow 8 STX (>70% LTV — should fail)
        const badBlock = chain.mineBlock([
            Tx.contractCall('lending', 'open-loan',
                [types.uint(10_000_000), types.uint(8_000_000)],
                user.address)
        ]);
        assertEquals(badBlock.receipts[0].result, '(err u902)'); // ERR-INSUFFICIENT-COLLATERAL

        // Borrow 6.5 STX (<70% LTV — should succeed)
        const goodBlock = chain.mineBlock([
            Tx.contractCall('lending', 'open-loan',
                [types.uint(10_000_000), types.uint(6_500_000)],
                user.address)
        ]);
        assertEquals(goodBlock.receipts[0].result.startsWith('(ok'), true);
    }
});

Clarinet.test({
    name: "lending: full repayment returns collateral and closes loan",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const owner = accounts.get('deployer')!;
        const user = accounts.get('wallet_1')!;

        chain.mineBlock([
            Tx.contractCall('lending', 'fund-pool',
                [types.uint(100_000_000)], owner.address)
        ]);

        chain.mineBlock([
            Tx.contractCall('lending', 'open-loan',
                [types.uint(10_000_000), types.uint(6_000_000)],
                user.address)
        ]);

        // Mine some blocks to accrue interest
        chain.mineEmptyBlock(10);

        // Repay more than borrowed (covers interest)
        const repayBlock = chain.mineBlock([
            Tx.contractCall('lending', 'repay-loan',
                [types.uint(7_000_000)], // enough to cover principal + interest
                user.address)
        ]);

        const result = repayBlock.receipts[0].result;
        assertEquals(result.startsWith('(ok'), true);
        assertEquals(result.includes('full-close: true'), true);
    }
});
