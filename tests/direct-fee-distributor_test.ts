import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.4.2/index.ts';

Clarinet.test({
    name: 'Ensure that pay-fee respects disabled status',
    async fn(chain: Chain, accounts: Map<string, Account>) { }
});
