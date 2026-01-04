/**
 * Logger utility for development and production environments
 * In production, all logs are disabled for security
 * In development, logs work normally
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, but sanitize sensitive data in production
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log only the error type without sensitive details
      console.error('An error occurred. Please contact support if this persists.');
    }
  },
  
  // Special method for API responses - never log in production
  apiResponse: (endpoint, data) => {
    if (isDevelopment) {
      console.log(`API Response [${endpoint}]:`, data);
    }
  },
  
  // Special method for user data - never log in production
  userData: (label, data) => {
    if (isDevelopment) {
      console.log(`User Data [${label}]:`, data);
    }
  },
  
  // Special method for WebSocket messages - never log in production
  websocket: (message, data) => {
    if (isDevelopment) {
      console.log(`WebSocket [${message}]:`, data);
    }
  }
};

export default logger;
