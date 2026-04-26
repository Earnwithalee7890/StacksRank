/**
 * StacksRank SDK - Wallet Helpers
 * 
 * Utilities for connecting to Leather/Hiro wallet and calling contracts
 * via the LeatherProvider API. Works in any browser environment.
 */

/**
 * Check if a Stacks wallet extension is available
 * @returns {{ available: boolean, provider: string|null }}
 */
function detectWallet() {
    if (typeof window === 'undefined') {
        return { available: false, provider: null };
    }
    if (window.LeatherProvider) {
        return { available: true, provider: 'leather' };
    }
    if (window.StacksProvider) {
        return { available: true, provider: 'stacks' };
    }
    return { available: false, provider: null };
}

/**
 * Connect to the user's Leather wallet and retrieve the STX address.
 * @returns {Promise<string>} The connected STX address
 * @throws {Error} If wallet is not installed or connection fails
 */
async function connectWallet() {
    const { available } = detectWallet();
    if (!available) {
        throw new Error('No Stacks wallet extension detected. Please install Leather from leather.io');
    }

    const response = await window.LeatherProvider.request('getAddresses');
    
    let stxAddr = null;
    if (response?.result?.addresses) {
        const found = response.result.addresses.find(a => a.symbol === 'STX');
        if (found) stxAddr = found.address;
    }

    if (!stxAddr) {
        // Fallback method
        const fallback = await window.LeatherProvider.request('stx_requestAccounts');
        if (fallback?.result?.addresses?.[0]?.address) {
            stxAddr = fallback.result.addresses[0].address;
        }
    }

    if (!stxAddr) {
        throw new Error('Could not retrieve STX address from wallet');
    }

    return stxAddr;
}

/**
 * Call a Clarity smart contract via Leather wallet.
 * @param {Object} options
 * @param {string} options.contract - Full contract identifier (e.g., "SP...address.contract-name")
 * @param {string} options.functionName - The public function to call
 * @param {string[]} [options.functionArgs=[]] - Pre-encoded hex argument strings
 * @param {string} [options.network='mainnet'] - Network: 'mainnet' or 'testnet'
 * @param {Object} [options.appDetails] - App details for the wallet prompt
 * @returns {Promise<Object>} The transaction response from the wallet
 */
async function callContract({ contract, functionName, functionArgs = [], network = 'mainnet', appDetails = {} }) {
    const { available } = detectWallet();
    if (!available) {
        throw new Error('No Stacks wallet extension detected');
    }

    const response = await window.LeatherProvider.request('stx_callContract', {
        contract,
        functionName,
        functionArgs,
        network,
        postConditionMode: 'allow',
        appDetails
    });

    return response;
}

/**
 * Format a Stacks address for display (truncated).
 * @param {string} address - Full Stacks address
 * @param {number} [startChars=6] - Characters to show at start
 * @param {number} [endChars=4] - Characters to show at end
 * @returns {string} Formatted address like "SP2J6Z...9EJ7"
 */
function formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Fetch the STX balance of a given address.
 * @param {string} address - The STX address to check
 * @param {string} [network='mainnet'] - 'mainnet' or 'testnet'
 * @returns {Promise<number>} Balance in microstacks
 */
async function getBalance(address, network = 'mainnet') {
    const baseUrl = network === 'mainnet' ? 'https://api.mainnet.hiro.so' : 'https://api.testnet.hiro.so';
    const url = `${baseUrl}/extended/v1/address/${address}/balances`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return parseInt(data.stx.balance, 10);
    } catch (error) {
        console.error('Error fetching balance:', error);
        return 0;
    }
}

module.exports = {
    detectWallet,
    connectWallet,
    callContract,
    formatAddress,
    getBalance
};
