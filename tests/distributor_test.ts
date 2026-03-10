import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.6/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
  name: "stx-distributor: deposit and claim rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet_1 = accounts.get('wallet_1')!;
    
    // 1. Owner deposits 100 STX
    let block = chain.mineBlock([
      Tx.contractCall('stx-distributor', 'deposit', [types.uint(100000000)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000000);
    
    // 2. User claims reward (0.1 STX by default in contract)
    block = chain.mineBlock([
      Tx.contractCall('stx-distributor', 'claim', [], wallet_1.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(100000);
    
    // 3. User tries to claim again immediately (should fail)
    block = chain.mineBlock([
      Tx.contractCall('stx-distributor', 'claim', [], wallet_1.address)
    ]);
    block.receipts[0].result.expectErr().expectUint(403); // ERR-TOO-SOON
  },
});

Clarinet.test({
  name: "stx-distributor: admin controls",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Set custom claim amount to 1 STX
    let block = chain.mineBlock([
      Tx.contractCall('stx-distributor', 'set-claim-amount', [types.uint(1000000)], deployer.address)
    ]);
    block.receipts[0].result.expectOk().expectUint(1000000);
    
    // Verify changes
    let result = chain.callReadOnlyFn('stx-distributor', 'get-claim-amount', [], deployer.address);
    result.result.expectOk().expectUint(1000000);
  },
});
