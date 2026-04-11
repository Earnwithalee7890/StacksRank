/**
 * StacksRank SDK - Clarity Contract Constants (ESM)
 */

export const DEPLOYER = 'SP2F500B8DTRK1EANJQ054BRAB8DDKN6QCMXGNFBT';

export const CONTRACTS = {
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

export const CLARITY_CODE = {
    SUCCESS: 0,
    ERR_UNAUTHORIZED: 401,
    ERR_NOT_FOUND: 404,
    ERR_INSUFFICIENT_FUNDS: 402,
    ERR_FORBIDDEN: 403
};

export const CLARITY_TYPES = {
    INT: 'int',
    UINT: 'uint',
    PRINCIPAL: 'principal',
    BUFFER: 'buffer',
    BOOL: 'bool',
    RESPONSE: 'response',
    TUPLE: 'tuple',
    LIST: 'list'
};

export const SIP010_TYPES = {
    TRANSFER: 'transfer',
    GET_NAME: 'get-name',
    GET_SYMBOL: 'get-symbol',
    GET_DECIMALS: 'get-decimals',
    GET_BALANCE: 'get-balance',
    GET_TOTAL_SUPPLY: 'get-total-supply',
    GET_TOKEN_URI: 'get-token-uri'
};

export function getContractAddresses() {
    const addresses = {};
    for (const [key, val] of Object.entries(CONTRACTS)) {
        addresses[key] = val.address;
    }
    return addresses;
}
