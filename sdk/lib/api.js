/**
 * StacksRank SDK - Hiro API Utilities
 * 
 * Helpers for querying the Stacks blockchain via the Hiro API.
 * No dependencies — uses native fetch.
 */

const STACKS_NODE_URLS = {
    mainnet: 'https://api.mainnet.hiro.so',
    testnet: 'https://api.testnet.hiro.so',
    local: 'http://localhost:3999'
};

/**
 * API URL Resolver
 * @param {string} [network='mainnet']
 * @returns {string}
 */
const resolveApiUrl = (network = 'mainnet') => STACKS_NODE_URLS[network] || STACKS_NODE_URLS.mainnet;

/**
 * Fetch with exponential backoff retry
 * @param {string} url 
 * @param {Object} [options={}] 
 * @param {number} [maxRetries=3] 
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            if (res.status === 429 || res.status >= 500) throw new Error(`Status ${res.status}`);
            return res; // Return even if 4xx to handle errors upstream
        } catch (e) {
            if (i === maxRetries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
}

/**
 * Fetch the STX balance and fungible token balances for an address.
 * @param {string} address - Stacks address
 * @param {string} [network='mainnet']
 * @returns {Promise<{ stx: number, tokens: Object }>}
 */
async function getBalance(address, network = 'mainnet') {
    const url = `${resolveApiUrl(network)}/extended/v1/address/${address}/balances`;
    const res = await fetchWithRetry(url);
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
 * Get recent transactions for an address.
 */
async function getTransactions(address, { limit = 20, offset = 0, network = 'mainnet' } = {}) {
    const url = `${resolveApiUrl(network)}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    return data.results || [];
}

/**
 * Get address mempool occupancy
 * @param {string} address 
 * @returns {Promise<Object[]>}
 */
async function getAddressMempool(address) {
    const url = `${resolveApiUrl()}/extended/v1/address/${address}/mempool`;
    return fetchWithRetry(url).then(res => res.json());
}

/**
 * Get the status of a specific transaction.
 * @param {string} txId - Transaction ID
 * @param {string} [network='mainnet']
 */
async function getTransactionStatus(txId, network = 'mainnet') {
    const url = `${resolveApiUrl(network)}/extended/v1/tx/${txId}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    return data.tx_status;
}

/**
 * Call a read-only contract function.
 * @param {string} contractAddress - e.g., "SP...address"
 * @param {string} contractName - e.g., "contract-name"
 * @param {string} functionName - e.g., "get-balance"
 * @param {string[]} [args=[]] - Pre-encoded hex argument strings
 * @param {string} [sender] - Optional sender address
 * @param {string} [network='mainnet']
 */
async function readContract(contractAddress, contractName, functionName, args = [], sender = 'SP000000000000000000002Q6VF78', network = 'mainnet') {
    const url = `${resolveApiUrl(network)}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
    const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, arguments: args })
    });
    return res.json();
}

/**
 * Get the current block height.
 * @param {string} [network='mainnet']
 */
async function getBlockHeight(network = 'mainnet') {
    const url = `${resolveApiUrl(network)}/extended/v1/block?limit=1`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    return data.results?.[0]?.height || 0;
}

/**
 * Convert microSTX to STX.
 */
function microToStx(val) {
    return Number(val) / 1_000_000;
}

/**
 * Convert STX to microSTX.
 */
function stxToMicro(val) {
    return Math.floor(Number(val) * 1_000_000);
}

/**
 * Sanitizes a Stacks principal string.
 * @param {string} p - Principal to check
 * @returns {string|null} The principal if valid, else null
 */
const sanitizePrincipal = (p) => {
    if (!p || typeof p !== 'string') return null;
    return p.trim().split(".").length >= 1 ? p.trim() : null;
};

module.exports = {
    resolveApiUrl,
    fetchWithRetry,
    getBalance,
    getTransactions,
    getAddressMempool,
    getTransactionStatus,
    readContract,
    getBlockHeight,
    microToStx,
    stxToMicro,
    sanitizePrincipal
};


