/**
 * StacksRank SDK - Wallet Helpers (ESM)
 */

export function detectWallet() {
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

export async function connectWallet() {
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

export async function callContract({ contract, functionName, functionArgs = [], network = 'mainnet', appDetails = {} }) {
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

export function formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
