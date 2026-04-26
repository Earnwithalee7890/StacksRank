/**
 * StacksRank SDK - Network Constants
 */

const MAINNET = {
    coreApiUrl: 'https://api.mainnet.hiro.so',
    chainId: 1,
    networkId: 1
};

const TESTNET = {
    coreApiUrl: 'https://api.testnet.hiro.so',
    chainId: 2147483648,
    networkId: 2147483648
};

const CONTRACTS = {
    REPUTATION: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation',
    SWAP: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap',
    VAULT: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault',
    BUILDER_TOOLS: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.defi-builder-tools',
    DISTRIBUTOR: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.stx-distributor'
};

module.exports = {
    MAINNET,
    TESTNET,
    CONTRACTS
};
