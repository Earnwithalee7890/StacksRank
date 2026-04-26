/**
 * StacksRank SDK - Data Validation
 */

/**
 * Validates a Stacks address
 * @param {string} address 
 * @returns {boolean}
 */
function isValidAddress(address) {
    if (!address || typeof address !== 'string') return false;
    // Basic regex for Stacks address (SP or SM followed by 28-41 alphanumeric chars)
    const regex = /^(S[PM][0-9A-Z]{28,41})$/i;
    return regex.test(address);
}

/**
 * Validates a contract identifier
 * @param {string} contractId 
 * @returns {boolean}
 */
function isValidContractId(contractId) {
    if (!contractId || typeof contractId !== 'string') return false;
    const parts = contractId.split('.');
    if (parts.length !== 2) return false;
    return isValidAddress(parts[0]) && parts[1].length > 0;
}

/**
 * Validates a number is positive
 * @param {number|string} value 
 * @returns {boolean}
 */
function isPositiveNumber(value) {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
}

module.exports = {
    isValidAddress,
    isValidContractId,
    isPositiveNumber
};
