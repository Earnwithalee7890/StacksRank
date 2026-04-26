/**
 * StacksRank - Formatting Utilities
 */

(function() {
    const SRFormatters = {
        /**
         * Format microstacks to STX
         * @param {number|string} ustx 
         * @returns {string}
         */
        formatSTX: (ustx) => {
            const stx = parseFloat(ustx) / 1000000;
            return stx.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6
            }) + ' STX';
        },

        /**
         * Format address for display
         * @param {string} address 
         * @returns {string}
         */
        truncateAddress: (address) => {
            if (!address) return '';
            return address.slice(0, 6) + '...' + address.slice(-4);
        },

        /**
         * Format date to locale string
         * @param {string|number|Date} date 
         * @returns {string}
         */
        formatDate: (date) => {
            return new Date(date).toLocaleDateString();
        }
    };

    window.SRFormatters = SRFormatters;
})();
