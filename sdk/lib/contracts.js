/**
 * StacksRank SDK - Contract Registry
 * 
 * All deployed StacksRank contract addresses and their public functions.
 */

const DEPLOYER = 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT';

const CONTRACTS = {
    /** On-chain reputation tracking */
    REPUTATION: {
        address: `${DEPLOYER}.simple-reputation`,
        functions: {
            register: 'register',
            updateScore: 'update-score',
            getScore: 'get-score'
        }
    },

    /** Atomic token swaps */
    SWAP: {
        address: `${DEPLOYER}.simple-swap`,
        functions: {
            createSwap: 'create-swap',
            executeSwap: 'execute-swap',
            cancelSwap: 'cancel-swap'
        }
    },

    /** Multi-sig vault with staking */
    VAULT: {
        address: `${DEPLOYER}.simple-vault`,
        functions: {
            createVault: 'create-vault',
            deposit: 'deposit',
            withdraw: 'withdraw'
        }
    },

    /** Daily builder check-in (streak tracking) */
    FEB_CHECKIN: {
        address: `${DEPLOYER}.feb-builder-check-in`,
        functions: {
            checkIn: 'check-in',
            getLastCheckIn: 'get-last-check-in',
            getCheckInCount: 'get-check-in-count'
        }
    },

    /** Builder tools: registration, status updates, service requests */
    DEFI_TOOLS: {
        address: `${DEPLOYER}.defi-builder-tools`,
        functions: {
            registerBuilder: 'register-builder',
            updateStatus: 'update-status',
            requestService: 'request-service'
        }
    },

    /** Protocol fee distribution */
    FEE_DISTRIBUTOR: {
        address: `${DEPLOYER}.direct-fee-distributor`,
        functions: {
            payFee: 'pay-fee'
        }
    },

    /** Daily STX distribution (1 STX per 24h) */
    STX_DISTRIBUTOR: {
        address: `${DEPLOYER}.stx-distributor`,
        functions: {
            claim: 'claim'
        }
    }
};

/**
 * Get a flat map of contract name -> full address
 * @returns {Object} Contract address map
 */
function getContractAddresses() {
    const result = {};
    for (const [key, val] of Object.entries(CONTRACTS)) {
        result[key] = val.address;
    }
    return result;
}

/**
 * Get the deployer principal address
 * @returns {string} Deployer address
 */
function getDeployer() {
    return DEPLOYER;
}

module.exports = {
    CONTRACTS,
    DEPLOYER,
    getContractAddresses,
    getDeployer
};

/**
 * ENUM for Clarinet Types
 */
const CLARITY_TYPES = { INT: 'int', UINT: 'uint', PRINCIPAL: 'principal' };

const parseTuple = (tupleStr) => { return {}; };
