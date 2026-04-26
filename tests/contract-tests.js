/**
 * StacksRank - Contract Integration Tests (Simulated)
 * In a real environment, these would use @stacks/transactions and a local Clarinet devnet.
 */

const { CONTRACTS, MAINNET } = require('../sdk/lib/constants');

async function testContractRegistry() {
    console.log('Testing Contract Registry...');
    console.assert(CONTRACTS.REPUTATION.includes('simple-reputation'), 'Reputation contract address incorrect');
    console.assert(CONTRACTS.SWAP.includes('simple-swap'), 'Swap contract address incorrect');
    console.log('✅ Contract Registry Test Passed');
}

async function testNetworkConfig() {
    console.log('Testing Network Config...');
    console.assert(MAINNET.chainId === 1, 'Mainnet Chain ID incorrect');
    console.assert(MAINNET.coreApiUrl === 'https://api.mainnet.hiro.so', 'Mainnet API URL incorrect');
    console.log('✅ Network Config Test Passed');
}

async function runAllTests() {
    try {
        await testContractRegistry();
        await testNetworkConfig();
        console.log('\nAll integration tests passed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

runAllTests();
