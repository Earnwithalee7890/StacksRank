/**
 * StacksRank - Logger Utility (Global)
 */

(function() {
    const LOG_LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    class Logger {
        constructor(level = LOG_LEVELS.INFO) {
            this.level = level;
        }

        debug(...args) {
            if (this.level <= LOG_LEVELS.DEBUG) {
                console.debug('[DEBUG]', ...args);
            }
        }

        info(...args) {
            if (this.level <= LOG_LEVELS.INFO) {
                console.info('[INFO]', ...args);
            }
        }

        warn(...args) {
            if (this.level <= LOG_LEVELS.WARN) {
                console.warn('[WARN]', ...args);
            }
        }

        error(...args) {
            if (this.level <= LOG_LEVELS.ERROR) {
                console.error('[ERROR]', ...args);
            }
        }
    }

    // Determine default level
    const defaultLevel = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? LOG_LEVELS.DEBUG 
        : LOG_LEVELS.INFO;

    window.SRLogger = new Logger(defaultLevel);
})();
