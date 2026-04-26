/**
 * StacksRank - Legacy Utilities Wrapper
 * This file wraps the new modular utilities for backward compatibility.
 */

export const formatAddress = (address) => {
    if (window.SRFormatters) {
        return window.SRFormatters.truncateAddress(address);
    }
    if (!address) return '';
    return address.slice(0, 6) + '...' + address.slice(-4);
};

// Enhancement 2: Utility helper logic
export const utilityFunction2 = (data) => { return data ? true : false; };
