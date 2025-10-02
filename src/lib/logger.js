// src/lib/logger.js
const COLORS = {
    reset: '\x1b[0m', gray: '\x1b[90m', cyan: '\x1b[36m',
    yellow: '\x1b[33m', red: '\x1b[31m', green: '\x1b[32m'
};
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const levelName = (process.env.LOG_LEVEL || 'info').toLowerCase();
const LEVEL = LEVELS[levelName] ?? LEVELS.info;

function stamp(tag, color) {
    const ts = new Date().toISOString();
    return `${COLORS.gray}[${ts}]${COLORS.reset} ${color}${tag}${COLORS.reset}`;
}

export const log = {
    error: (...a) => { if (LEVEL >= 0) console.error(stamp('ERROR', COLORS.red), ...a); },
    warn:  (...a) => { if (LEVEL >= 1) console.warn(stamp('WARN ', COLORS.yellow), ...a); },
    info:  (...a) => { if (LEVEL >= 2) console.log(stamp('INFO ', COLORS.cyan), ...a); },
    debug: (...a) => { if (LEVEL >= 3) console.log(stamp('DEBUG', COLORS.green), ...a); },
};
