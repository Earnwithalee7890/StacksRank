/**
 * StacksRank - Local Storage Utility
 */

(function() {
    const SRStorage = {
        set: (key, value) => {
            try {
                localStorage.setItem(`sr_${key}`, JSON.stringify(value));
            } catch (e) {
                if (window.SRLogger) SRLogger.error('Storage error:', e);
            }
        },
        get: (key) => {
            try {
                const item = localStorage.getItem(`sr_${key}`);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                if (window.SRLogger) SRLogger.error('Storage error:', e);
                return null;
            }
        },
        remove: (key) => {
            localStorage.removeItem(`sr_${key}`);
        }
    };

    window.SRStorage = SRStorage;
})();
