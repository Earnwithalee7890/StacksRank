import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.4.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure builder can register with fee",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get('wallet_1')!;
        const block = chain.mineBlock([
            Tx.contractCall('defi-builder-tools', 'register-builder', [types.ascii("Builder"), types.ascii("https://builder.com")], wallet_1.address)
        ]);
        block.receipts[0].result.expectOk().expectBool(true);
    }
});
