/**
 * StacksRank SDK - Hiro API Utilities
 * 
 * Helpers for querying the Stacks blockchain via the Hiro API.
 * No dependencies — uses native fetch.
 */

const API_URLS = {
    mainnet: 'https://api.hiro.so',
    testnet: 'https://api.testnet.hiro.so'
};

/**
 * Get the API base URL for a given network.
 * @param {string} [network='mainnet']
 * @returns {string}
 */
function getApiUrl(network = 'mainnet') {
    return API_URLS[network] || API_URLS.mainnet;
}

/**
 * Fetch the STX balance and fungible token balances for an address.
 * @param {string} address - Stacks address
 * @param {string} [network='mainnet']
 * @returns {Promise<{ stx: number, tokens: Object }>}
 */
async function getBalance(address, network = 'mainnet') {
    const url = `${getApiUrl(network)}/extended/v1/address/${address}/balances`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    const data = await res.json();

    const stxBalance = parseInt(data.stx?.balance || '0') / 1_000_000;
    const tokens = {};

    if (data.fungible_tokens) {
        for (const [key, val] of Object.entries(data.fungible_tokens)) {
            tokens[key] = parseInt(val.balance || '0');
        }
    }

    return { stx: stxBalance, tokens };
}

/**
 * Fetch recent transactions for an address.
 * @param {string} address - Stacks address
 * @param {Object} [options]
 * @param {number} [options.limit=20] - Number of transactions to fetch
 * @param {number} [options.offset=0] - Pagination offset
 * @param {string} [options.network='mainnet']
 * @returns {Promise<Object[]>} Array of transaction objects
 */
async function getTransactions(address, { limit = 20, offset = 0, network = 'mainnet' } = {}) {
    const url = `${getApiUrl(network)}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.results || [];
}

/**
 * Get the current status of a transaction by its ID.
 * @param {string} txId - Transaction ID (with or without 0x prefix)
 * @param {string} [network='mainnet']
 * @returns {Promise<Object>} Transaction details
 */
async function getTransactionStatus(txId, network = 'mainnet') {
    const cleanId = txId.startsWith('0x') ? txId : `0x${txId}`;
    const url = `${getApiUrl(network)}/extended/v1/tx/${cleanId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
}

/**
 * Read a value from a Clarity smart contract (read-only function call).
 * @param {string} contractAddress - The contract deployer address
 * @param {string} contractName - The contract name
 * @param {string} functionName - The read-only function name
 * @param {string[]} [args=[]] - Hex-encoded Clarity arguments
 * @param {string} [network='mainnet']
 * @returns {Promise<Object>} The response from the read-only call
 */
async function readContract(contractAddress, contractName, functionName, args = [], network = 'mainnet') {
    const url = `${getApiUrl(network)}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sender: contractAddress,
            arguments: args
        })
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
}

/**
 * Get info about a deployed smart contract.
 * @param {string} contractId - Full contract ID (e.g., "SP...addr.contract-name")
 * @param {string} [network='mainnet']
 * @returns {Promise<Object>} Contract info including source code
 */
async function getContractInfo(contractId, network = 'mainnet') {
    const url = `${getApiUrl(network)}/extended/v1/contract/${contractId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json();
}

/**
 * Get the current Stacks block height.
 * @param {string} [network='mainnet']
 * @returns {Promise<number>}
 */
async function getBlockHeight(network = 'mainnet') {
    const url = `${getApiUrl(network)}/extended/v1/block?limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.results?.[0]?.height || 0;
}

/**
 * Convert microSTX to STX.
 * @param {number|string} microStx
 * @returns {number}
 */
function microToStx(microStx) {
    return parseInt(microStx) / 1_000_000;
}

/**
 * Convert STX to microSTX.
 * @param {number} stx
 * @returns {number}
 */
function stxToMicro(stx) {
    return Math.round(stx * 1_000_000);
}

module.exports = {
    API_URLS,
    getApiUrl,
    getBalance,
    getTransactions,
    getTransactionStatus,
    readContract,
    getContractInfo,
    getBlockHeight,
    microToStx,
    stxToMicro
};

// Helper: parse api url safely
const parseApiUrl = (url) => new URL(url).toString();

// 2.1 Support: getBurnBlockHeight
async function getBurnBlockHeight() { return 0; }

// Retry helper
async function fetchWithRetry(url, options = {}, retries = 3) { /* implementation */ }

/** @typedef {Object} BalanceResponse */
