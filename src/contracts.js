// StacksRank - Deployed Contract Configuration
// Update these addresses when deploying to different networks

// Contract addresses on Hiro Sandbox
export const NETWORK = 'testnet'; // or 'mainnet'

export const CONTRACT_ADDRESSES = {
    REPUTATION: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-reputation',
    SWAP: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-swap',
    VAULT: 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT.simple-vault'
};

// Network configuration
export const STACKS_NETWORK = {
    testnet: 'https://api.testnet.hiro.so',
    mainnet: 'https://api.hiro.so'
};

// Explorer URLs
export const EXPLORER_URL = {
    testnet: 'https://explorer.hiro.so/?chain=testnet',
    mainnet: 'https://explorer.hiro.so'
};

// Contract explorer links
export function getContractExplorerUrl(contractAddress) {
    const baseUrl = EXPLORER_URL[NETWORK];
    return `${baseUrl}/txid/${contractAddress}`;
}

// Quick access to your deployed contracts
export const DEPLOYED_CONTRACTS = {
    reputation: {
        address: CONTRACT_ADDRESSES.REPUTATION,
        explorer: `${EXPLORER_URL[NETWORK]}/txid/${CONTRACT_ADDRESSES.REPUTATION}`,
        functions: {
            register: 'register-user',
            checkIn: 'daily-check-in',
            addContribution: 'add-contribution',
            getUserInfo: 'get-user-info',
            getTotalUsers: 'get-total-users',
            getStats: 'get-leaderboard-stats'
        }
    },
    swap: {
        address: CONTRACT_ADDRESSES.SWAP,
        explorer: `${EXPLORER_URL[NETWORK]}/txid/${CONTRACT_ADDRESSES.SWAP}`,
        functions: {
            createSwap: 'create-swap',
            acceptSwap: 'accept-swap',
            cancelSwap: 'cancel-swap',
            getSwap: 'get-swap',
            getStats: 'get-stats',
            calculateFee: 'calculate-fee'
        }
    },
    vault: {
        address: CONTRACT_ADDRESSES.VAULT,
        explorer: `${EXPLORER_URL[NETWORK]}/txid/${CONTRACT_ADDRESSES.VAULT}`,
        functions: {
            createVault: 'create-vault',
            deposit: 'deposit',
            proposeWithdrawal: 'propose-withdrawal',
            signProposal: 'sign-proposal',
            getVault: 'get-vault',
            getProposal: 'get-proposal',
            isSigner: 'is-signer'
        }
    }
};

console.log('📝 Contract addresses loaded:', CONTRACT_ADDRESSES);
console.log('🌐 Network:', NETWORK);
console.log('🔍 Explorer:', EXPLORER_URL[NETWORK]);
