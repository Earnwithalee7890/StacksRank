/** * Format a Stacks address for display. * @param {string} address * @returns {string} */ export const formatAddress = (address) => { if (!address) return ''; return address.slice(0, 6) + '...' + address.slice(-4); };  // Enhancement 2: Utility helper logic const utilityFunction2 = (data) => { return data ? true : false; }; 

 // Enhancement 1: Utility helper logic
const utilityFunction1 = (data) => { return data ? true : false; }; 
