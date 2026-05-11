/**
 * StacksRank SDK - Validation Utilities
 * 
 * Functions for validating Stacks-specific data formats.
 */

/**
 * Validates a Stacks address string.
 * Supports standard principals (SP...) and contract principals (SP...contract-name).
 * 
 * @param {string} address - The address to validate
 * @returns {boolean} True if the address is valid, false otherwise
 */
function isValidStacksAddress(address) {
    if (typeof address !== 'string') return false;
    
    // Basic regex check for Stacks address format
    // Standard: S[M|P|T|N][0-9A-Z]{38,40}
    // Contract: S[M|P|T|N][0-9A-Z]{38,40}.[a-zA-Z][a-zA-Z0-9_-]*
    const standardRegex = /^[SMTN][0-9A-HJKMNP-TV-Z]{38,41}$/;
    const contractRegex = /^[SMTN][0-9A-HJKMNP-TV-Z]{38,41}\.[a-zA-Z]([a-zA-Z0-9_-]{0,127})$/;
    
    return standardRegex.test(address) || contractRegex.test(address);
}

/**
 * Validates if a string is a valid Clarity contract name.
 * 
 * @param {string} name - The contract name to validate
 * @returns {boolean} True if the name is valid
 */
function isValidContractName(name) {
    if (typeof name !== 'string') return false;
    const nameRegex = /^[a-zA-Z]([a-zA-Z0-9_-]{0,127})$/;
    return nameRegex.test(name);
}

module.exports = {
    isValidStacksAddress,
    isValidContractName
};
