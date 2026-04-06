/**
 * StacksRank SDK
 * 
 * Official SDK for interacting with StacksRank smart contracts on the Stacks blockchain.
 * 
 * Features:
 * - Clarity value encoding (string, uint, int, bool, principal, buffer)
 * - Contract registry with all deployed StacksRank contracts
 * - Leather wallet connection and contract call helpers
 * - Hiro API utilities (balance, transactions, read-only calls)
 * 
 * @example
 * const { encoding, contracts, wallet, api } = require('@earnwithalee/stacksrank-sdk');
 * 
 * // Encode a Clarity string
 * const encoded = encoding.encodeStringAscii("Hello Stacks!");
 * 
 * // Get contract addresses
 * const addresses = contracts.getContractAddresses();
 * 
 * // Check balance
 * const { stx } = await api.getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7");
 * 
 * @module @earnwithalee/stacksrank-sdk
 */

const encoding = require('./lib/encoding');
const contracts = require('./lib/contracts');
const wallet = require('./lib/wallet');
const api = require('./lib/api');

module.exports = {
    // Namespaced modules
    encoding,
    contracts,
    wallet,
    api,

    // Re-export commonly used functions at top level for convenience
    encodeStringAscii: encoding.encodeStringAscii,
    encodeStringUtf8: encoding.encodeStringUtf8,
    encodeUint: encoding.encodeUint,
    encodeInt: encoding.encodeInt,
    encodeBool: encoding.encodeBool,
    encodePrincipal: encoding.encodePrincipal,
    encodeBuffer: encoding.encodeBuffer,

    CONTRACTS: contracts.CONTRACTS,
    DEPLOYER: contracts.DEPLOYER,
    getContractAddresses: contracts.getContractAddresses,

    detectWallet: wallet.detectWallet,
    connectWallet: wallet.connectWallet,
    callContract: wallet.callContract,
    formatAddress: wallet.formatAddress,

    getBalance: api.getBalance,
    getTransactions: api.getTransactions,
    getTransactionStatus: api.getTransactionStatus,
    readContract: api.readContract,
    getBlockHeight: api.getBlockHeight,
    microToStx: api.microToStx,
    stxToMicro: api.stxToMicro
};
