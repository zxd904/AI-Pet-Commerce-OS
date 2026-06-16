const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

function formatMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level}] ${message}${dataStr}`;
}

export const modelLogger = {
  info: (message: string, data?: any) => {
    console.log(formatMessage(LOG_LEVELS.INFO, message, data));
  },
  warn: (message: string, data?: any) => {
    console.warn(formatMessage(LOG_LEVELS.WARN, message, data));
  },
  error: (message: string, data?: any) => {
    console.error(formatMessage(LOG_LEVELS.ERROR, message, data));
  },
  debug: (message: string, data?: any) => {
    console.debug(formatMessage(LOG_LEVELS.DEBUG, message, data));
  }
};
