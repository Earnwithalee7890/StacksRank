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

Clarinet.test({
    name: "simple-reputation: quadratic scoring rewards higher streaks",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const wallet_1 = accounts.get("wallet_1")!;

        chain.mineBlock([
            Tx.contractCall("simple-reputation", "register-user", [], wallet_1.address),
            Tx.contractCall("simple-reputation", "daily-check-in", [], wallet_1.address), // Streak 1
        ]);

        // Contribution with streak 1
        let block = chain.mineBlock([
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Test contribution"), types.uint(100)],
                wallet_1.address
            ),
        ]);
        
        // Multiplier at streak 1: 100 + (1*1)/10 = 100.1 -> 100% -> 100 points
        let receipt = block.receipts[0];
        let event = receipt.events.find((e: any) => e.type === "contract_event" && e.contract_event.topic === "print");
        // @ts-ignore
        assertEquals(event.contract_event.value.expectTuple()["points"].expectUint(100), true);

        // Fast forward 150 blocks to check in again
        chain.mineEmptyBlock(150);
        
        chain.mineBlock([
            Tx.contractCall("simple-reputation", "daily-check-in", [], wallet_1.address), // Streak 2
        ]);

        // Contribution with streak 2
        block = chain.mineBlock([
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Another contribution"), types.uint(100)],
                wallet_1.address
            ),
        ]);
        
        // Multiplier at streak 2: 100 + (2*2)/10 = 100.4 -> 100.4% -> 100 points (floor)
        // Let's test streak 10
        for(let i=0; i<8; i++) {
            chain.mineEmptyBlock(150);
            chain.mineBlock([Tx.contractCall("simple-reputation", "daily-check-in", [], wallet_1.address)]);
        }

        block = chain.mineBlock([
            Tx.contractCall(
                "simple-reputation",
                "add-contribution",
                [types.ascii("Big streak contribution"), types.uint(100)],
                wallet_1.address
            ),
        ]);
        
        // Multiplier at streak 10: 100 + (10*10)/10 = 110% -> 110 points
        receipt = block.receipts[0];
        event = receipt.events.find((e: any) => e.type === "contract_event" && e.contract_event.topic === "print");
        // @ts-ignore
        assertEquals(event.contract_event.value.expectTuple()["points"].expectUint(110), true);
    }
});

