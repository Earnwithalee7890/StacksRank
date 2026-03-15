/**
 * Format a Stacks address for display.
 * @param {string} address
 * @returns {string}
 */
export const formatAddress = (address) => {
    if (!address) return '';
    return address.slice(0, 6) + '...' + address.slice(-4);
};

// add debounce utility for performance
export const debounce = (data) => { return data ? JSON.parse(JSON.stringify(data)) : null; };
