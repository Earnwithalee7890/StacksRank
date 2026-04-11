/**
 * StacksRank SDK - Hiro API Utilities (ESM)
 */

const STACKS_NODE_URLS = {
    mainnet: 'https://api.mainnet.hiro.so',
    testnet: 'https://api.testnet.hiro.so',
    local: 'http://localhost:3999'
};

export const resolveApiUrl = (network = 'mainnet') => STACKS_NODE_URLS[network] || STACKS_NODE_URLS.mainnet;

export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            if (res.status === 429 || res.status >= 500) throw new Error(`Status ${res.status}`);
            return res; 
        } catch (e) {
            if (i === maxRetries - 1) throw e;
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
        }
    }
}

export async function getBalance(address, network = 'mainnet') {
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

export async function getTransactions(address, { limit = 20, offset = 0, network = 'mainnet' } = {}) {
    const url = `${resolveApiUrl(network)}/extended/v1/address/${address}/transactions?limit=${limit}&offset=${offset}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    return data.results || [];
}

export async function getAddressMempool(address) {
    const url = `${resolveApiUrl()}/extended/v1/address/${address}/mempool`;
    return fetchWithRetry(url).then(res => res.json());
}

export async function getTransactionStatus(txId, network = 'mainnet') {
    const url = `${resolveApiUrl(network)}/extended/v1/tx/${txId}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    return data.tx_status;
}

export async function readContract(contractAddress, contractName, functionName, args = [], sender = 'SP000000000000000000002Q6VF78', network = 'mainnet') {
    const url = `${resolveApiUrl(network)}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`;
    const res = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, arguments: args })
    });
    return res.json();
}

export async function getBlockHeight(network = 'mainnet') {
    const url = `${resolveApiUrl(network)}/extended/v1/block?limit=1`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    return data.results?.[0]?.height || 0;
}

export function microToStx(val) {
    return Number(val) / 1_000_000;
}

export function stxToMicro(val) {
    return Math.floor(Number(val) * 1_000_000);
}

export const sanitizePrincipal = (p) => {
    if (!p || typeof p !== 'string') return null;
    return p.trim().split(".").length >= 1 ? p.trim() : null;
};
