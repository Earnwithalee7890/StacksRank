
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.4/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
    name: "advanced-swap: multi-hop quote returns correct expected amount",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        // 1. Create two pools: Pool 1 (A-B), Pool 2 (B-C)
        chain.mineBlock([
            Tx.contractCall('advanced-swap', 'create-pool',
                [types.uint(1_000_000), types.uint(1_000_000)], // Pool 1: 1:1
                deployer.address),
            Tx.contractCall('advanced-swap', 'create-pool',
                [types.uint(1_000_000), types.uint(2_000_000)], // Pool 2: 1:2
                deployer.address)
        ]);

        // 2. Quote for 100,000 units across both pools
        const result = chain.callReadOnlyFn('advanced-swap', 'get-multi-hop-quote', [
            types.uint(100_000),
            types.list([types.uint(1), types.uint(2)])
        ], deployer.address);

        // Expected approx: 
        // Hop 1: 100k -> ~90k (due to 1:1 reserves and fee)
        // Hop 2: 90k -> ~180k (due to 1:2 reserves)
        // Correct math: 100k * 0.997 * 1M / (1M + 100k*0.997) = 99700 * 1M / 1099700 = 90,661
        // Hop 2: 90,661 * 0.997 * 2M / (1M + 90,661*0.997) = 90,389 * 2M / 1,090,389 = 165,800
        
        result.result.expectOk().expectUint(165800);
    }
});
