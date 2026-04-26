/**
 * StacksRank - Logger Utility
 */

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

export const logger = new Logger(
    window.location.hostname === 'localhost' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO
);

export default logger;
