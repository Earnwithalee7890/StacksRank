const { StacksMainnet } = require('@stacks/network');
const {
    makeContractCall,
    broadcastTransaction,
    AnchorMode
} = require('@stacks/transactions');

// CONFIGURATION
const NETWORK = new StacksMainnet();
const SENDER_KEY = process.env.STACKS_PRIVATE_KEY;

// CONTRACTS
const CONTRACTS = {
    REPUTATION: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation',
    CHECKIN: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.feb-builder-check-in'
};

async function main() {
    if (!SENDER_KEY) {
        console.error('❌ Error: STACKS_PRIVATE_KEY environment variable not set.');
        console.error('   Run: $env:STACKS_PRIVATE_KEY="your_private_key"; node scripts/generate_activity.js');
        process.exit(1);
    }

    console.log('🚀 Starting Activity Generator for StacksRank...');

    try {
        // 1. Daily Check-in (Reputation)
        console.log('📝 Sending Daily Check-in...');
        const txOptions1 = {
            contractAddress: CONTRACTS.REPUTATION.split('.')[0],
            contractName: CONTRACTS.REPUTATION.split('.')[1],
            functionName: 'daily-check-in',
            functionArgs: [],
            senderKey: SENDER_KEY,
            network: NETWORK,
            anchorMode: AnchorMode.Any,
        };

        const transaction1 = await makeContractCall(txOptions1);
        const result1 = await broadcastTransaction(transaction1, NETWORK);
        console.log('   ✅ Check-in Broadcasted:', result1);

        // 2. Event Check-in (Builder)
        console.log('🏗️ Sending Builder Event Check-in...');
        const txOptions2 = {
            contractAddress: CONTRACTS.CHECKIN.split('.')[0],
            contractName: CONTRACTS.CHECKIN.split('.')[1],
            functionName: 'check-in',
            functionArgs: [],
            senderKey: SENDER_KEY,
            network: NETWORK,
            anchorMode: AnchorMode.Any,
        };

        const transaction2 = await makeContractCall(txOptions2);
        const result2 = await broadcastTransaction(transaction2, NETWORK);
        console.log('   ✅ Builder Check-in Broadcasted:', result2);

        console.log('🎉 Activity Generation Complete!');

    } catch (error) {
        console.error('❌ Error generating activity:', error);
    }
}

main();
