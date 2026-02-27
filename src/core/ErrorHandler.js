/**
 * ErrorHandler - Centralized error handling and logging
 * Validates: Requirements 6.6, 12.6
 */

export class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.errorCallbacks = [];
    }

    /**
     * Log an error with context
     * @param {Error} error - The error object
     * @param {string} context - Context where error occurred
     * @param {Object} data - Additional data for debugging
     */
    logError(error, context, data = {}) {
        const errorEntry = {
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            context,
            data
        };

        this.errors.push(errorEntry);

        // Keep only recent errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // Log to console with context
        console.error(`[${context}]`, error.message, data);
        if (error.stack) {
            console.error(error.stack);
        }

        // Notify callbacks
        this.errorCallbacks.forEach(callback => {
            try {
                callback(errorEntry);
            } catch (e) {
                console.error('Error in error callback:', e);
            }
        });
    }

    /**
     * Display user-friendly error message
     * @param {string} message - User-friendly message
     * @param {number} duration - Display duration in ms (default 5000)
     */
    displayError(message, duration = 5000) {
        // Create error overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(220, 38, 38, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            text-align: center;
        `;
        overlay.textContent = message;

        document.body.appendChild(overlay);

        // Auto-remove after duration
        setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 500);
        }, duration);
    }

    /**
     * Register callback for error notifications
     * @param {Function} callback - Callback function
     */
    onError(callback) {
        this.errorCallbacks.push(callback);
    }

    /**
     * Get recent errors
     * @param {number} count - Number of recent errors to return
     * @returns {Array} Recent error entries
     */
    getRecentErrors(count = 10) {
        return this.errors.slice(-count);
    }

    /**
     * Clear error history
     */
    clearErrors() {
        this.errors = [];
    }

    /**
     * Wrap a function with error handling
     * @param {Function} fn - Function to wrap
     * @param {string} context - Context for error logging
     * @param {Function} fallback - Optional fallback function
     * @returns {Function} Wrapped function
     */
    wrap(fn, context, fallback = null) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.logError(error, context, { args });
                
                if (fallback) {
                    try {
                        return fallback(...args);
                    } catch (fallbackError) {
                        this.logError(fallbackError, `${context}:fallback`);
                    }
                }
                
                return null;
            }
        };
    }

    /**
     * Wrap an async function with error handling
     * @param {Function} fn - Async function to wrap
     * @param {string} context - Context for error logging
     * @param {Function} fallback - Optional fallback function
     * @returns {Function} Wrapped async function
     */
    wrapAsync(fn, context, fallback = null) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.logError(error, context, { args });
                
                if (fallback) {
                    try {
                        return await fallback(...args);
                    } catch (fallbackError) {
                        this.logError(fallbackError, `${context}:fallback`);
                    }
                }
                
                return null;
            }
        };
    }

    /**
     * Handle graceful degradation for a system
     * @param {Function} fn - Function to try
     * @param {string} systemName - Name of the system
     * @param {Function} degradedFn - Degraded functionality
     * @returns {*} Result of fn or degradedFn
     */
    gracefulDegrade(fn, systemName, degradedFn) {
        try {
            return fn();
        } catch (error) {
            this.logError(error, `${systemName}:degradation`);
            this.displayError(`${systemName} encountered an error. Using fallback mode.`, 3000);
            
            try {
                return degradedFn();
            } catch (degradedError) {
                this.logError(degradedError, `${systemName}:degraded-fallback`);
                return null;
            }
        }
    }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Setup global error handlers
window.addEventListener('error', (event) => {
    errorHandler.logError(event.error || new Error(event.message), 'window:error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    errorHandler.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'window:unhandledrejection'
    );
});
