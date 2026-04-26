/**
 * StacksRank SDK - Clarity Contract Constants
 */

const DEPLOYER = 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT';

const CONTRACTS = {
    REPUTATION: {
        address: `${DEPLOYER}.simple-reputation`,
        functions: {
            getReputation: 'get-reputation',
            addReputation: 'add-reputation'
        }
    },
    SWAP: {
        address: `${DEPLOYER}.simple-swap`,
        functions: {
            swapStxForTokens: 'swap-stx-for-tokens',
            swapTokensForStx: 'swap-tokens-for-stx'
        }
    },
    VAULT: {
        address: `${DEPLOYER}.simple-vault`,
        functions: {
            deposit: 'deposit',
            withdraw: 'withdraw'
        }
    },
    FEB_CHECKIN: {
        address: `${DEPLOYER}.feb-builder-check-in`,
        functions: {
            checkIn: 'check-in'
        }
    },
    BUILDER_TOOLS: {
        address: `${DEPLOYER}.defi-builder-tools`,
        functions: {
            getScore: 'get-score'
        }
    },
    FEE_DISTRIBUTOR: {
        address: `${DEPLOYER}.direct-fee-distributor`,
        functions: {
            distribute: 'distribute'
        }
    },
    STX_DISTRIBUTOR: {
        address: `${DEPLOYER}.stx-distributor`,
        functions: {
            claim: 'claim',
            distribute: 'distribute'
        }
    }
};

const CLARITY_CODE = {
    SUCCESS: 0,
    ERR_UNAUTHORIZED: 401,
    ERR_NOT_FOUND: 404,
    ERR_INSUFFICIENT_FUNDS: 402,
    ERR_FORBIDDEN: 403
};

/**
 * Common Clarity traits and types used for UI mapping.
 */
const CLARITY_TYPES = {
    INT: 'int',
    UINT: 'uint',
    PRINCIPAL: 'principal',
    BUFFER: 'buffer',
    BOOL: 'bool',
    RESPONSE: 'response',
    TUPLE: 'tuple',
    LIST: 'list'
};

/**
 * Standard SIP-010 Trait Response types
 */
/**
 * Standard SIP-010 Trait Response types for Clarity integration.
 */
const SIP010_TYPES = {
    TRANSFER: 'transfer',
    GET_NAME: 'get-name',
    GET_SYMBOL: 'get-symbol',
    GET_DECIMALS: 'get-decimals',
    GET_BALANCE: 'get-balance',
    GET_TOTAL_SUPPLY: 'get-total-supply',
    GET_TOKEN_URI: 'get-token-uri'
};

/**
 * Retrieves a flattened map of all registered contract addresses.
 * Useful for bulk registration in wallet or client applications.
 * @returns {Object.<string, string>} A map of contract keys to their full Stacks addresses.
 */
function getContractAddresses() {
    const addresses = {};
    for (const [key, val] of Object.entries(CONTRACTS)) {
        addresses[key] = val.address;
    }
    return addresses;
}

module.exports = {
    DEPLOYER,
    CONTRACTS,
    CLARITY_CODE,
    CLARITY_TYPES,
    SIP010_TYPES,
    getContractAddresses
};


