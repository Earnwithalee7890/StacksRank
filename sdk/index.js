/**
 * StacksRank SDK
 * Main Entry Point
 */

const wallet = require('./lib/wallet');
const contracts = require('./lib/contracts');
const constants = require('./lib/constants');
const validation = require('./lib/validation');

module.exports = {
    // Wallet Helpers
    detectWallet: wallet.detectWallet,
    connectWallet: wallet.connectWallet,
    callContract: wallet.callContract,
    formatAddress: wallet.formatAddress,
    getBalance: wallet.getBalance,

    // Contract Helpers
    ...contracts,

    // Constants
    ...constants,

    // Validation
    ...validation,

    // Metadata
    version: require('./package.json').version,
    name: 'StacksRank SDK'
};
