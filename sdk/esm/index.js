/**
 * StacksRank SDK (ESM Entry Point)
 */

import * as encoding from './lib/encoding.js';
import * as contracts from './lib/contracts.js';
import * as wallet from './lib/wallet.js';
import * as api from './lib/api.js';

export {
    encoding,
    contracts,
    wallet,
    api
};

// Re-export common functions
export const {
    encodeStringAscii,
    encodeStringUtf8,
    encodeUint,
    encodeInt,
    encodeBool,
    encodePrincipal,
    encodeBuffer
} = encoding;

export const {
    CONTRACTS,
    DEPLOYER,
    getContractAddresses
} = contracts;

export const {
    detectWallet,
    connectWallet,
    callContract,
    formatAddress
} = wallet;

export const {
    getBalance,
    getTransactions,
    getTransactionStatus,
    readContract,
    getBlockHeight,
    microToStx,
    stxToMicro
} = api;
