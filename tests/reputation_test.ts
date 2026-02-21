import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types,
} from "https://deno.land/x/clarinet@v2.10.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/assertions.ts";

Clarinet.test({
    name: "simple-reputation: user can register and check in",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get("deployer")!;
        const wallet_1 = accounts.get("wallet_1")!;

        // 1. Register User
        let block = chain.mineBlock([
            Tx.contractCall("simple-reputation", "register-user", [], wallet_1.address),
        ]);
        block.receipts[0].result.expectOk().expectBool(true);

        // 2. Initial Tier should be Novice
        let tier = chain.callReadOnlyFn(
            "simple-reputation",
            "get-tier",
            [types.principal(wallet_1.address)],
            wallet_1.address
        );
        tier.result.expectOk().expectAscii("Novice");

        // 3. Daily Check-in
        block = chain.mineBlock([
            Tx.contractCall("simple-reputation", "daily-check-in", [], wallet_1.address),
        ]);
        // First check-in gives 10 + 1 (streak) = 11 points
        block.receipts[0].result.expectOk().expectUint(11);

        // 4. Check stats
        let stats = chain.callReadOnlyFn("simple-reputation", "get-leaderboard-stats", [], deployer.address);
        stats.result.expectOk().expectTuple()["total-users"].expectUint(1);
    },
});

Clarinet.test({
    name: "simple-reputation: tiered system works",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;

        chain.mineBlock([
            Tx.contractCall("simple-reputation", "register-user", [], wallet_1.address),
        ]);

        // Add contribution to reach Builder (100+)
        let block = chain.mineBlock([
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Major contribution"), types.uint(100)],
                wallet_1.address
            ),
        ]);
        block.receipts[0].result.expectOk().expectBool(true);

        let tier = chain.callReadOnlyFn(
            "simple-reputation",
            "get-tier",
            [types.principal(wallet_1.address)],
            wallet_1.address
        );
        tier.result.expectOk().expectAscii("Builder");

        // Add more to reach Legend (1000+)
        chain.mineBlock([
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Incredible work"), types.uint(100)],
                wallet_1.address
            ),
        ]);

        tier = chain.callReadOnlyFn(
            "simple-reputation",
            "get-tier",
            [types.principal(wallet_1.address)],
            wallet_1.address
        );
        tier.result.expectOk().expectAscii("Legend");
    },
});
