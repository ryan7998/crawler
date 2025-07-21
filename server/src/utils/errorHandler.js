/**
 * Centralized error handling utilities
 * Provides consistent error handling patterns across the application
 */

/**
 * Error types for categorization
 */
const ErrorTypes = {
    VALIDATION: 'VALIDATION',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    INTERNAL: 'INTERNAL',
    EXTERNAL: 'EXTERNAL',
    TIMEOUT: 'TIMEOUT',
    NETWORK: 'NETWORK'
};

/**
 * Error severity levels
 */
const ErrorSeverity = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};

/**
 * Standard error response format
 */
class AppError extends Error {
    constructor(message, type = ErrorTypes.INTERNAL, severity = ErrorSeverity.MEDIUM, details = {}) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.severity = severity;
        this.details = details;
        this.timestamp = new Date();
    }

    toJSON() {
        return {
            error: {
                message: this.message,
                type: this.type,
                severity: this.severity,
                details: this.details,
                timestamp: this.timestamp
            }
        };
    }
}

/**
 * Create validation error
 * @param {string} message - Error message
 * @param {Object} details - Validation details
 * @returns {AppError} Validation error
 */
function createValidationError(message, details = {}) {
    return new AppError(message, ErrorTypes.VALIDATION, ErrorSeverity.LOW, details);
}

/**
 * Create not found error
 * @param {string} resource - Resource that was not found
 * @param {string} id - ID of the resource
 * @returns {AppError} Not found error
 */
function createNotFoundError(resource, id = null) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    return new AppError(message, ErrorTypes.NOT_FOUND, ErrorSeverity.LOW, { resource, id });
}

/**
 * Create unauthorized error
 * @param {string} message - Error message
 * @returns {AppError} Unauthorized error
 */
function createUnauthorizedError(message = 'Unauthorized access') {
    return new AppError(message, ErrorTypes.UNAUTHORIZED, ErrorSeverity.HIGH);
}

/**
 * Create forbidden error
 * @param {string} message - Error message
 * @returns {AppError} Forbidden error
 */
function createForbiddenError(message = 'Access forbidden') {
    return new AppError(message, ErrorTypes.FORBIDDEN, ErrorSeverity.HIGH);
}

/**
 * Create conflict error
 * @param {string} message - Error message
 * @param {Object} details - Conflict details
 * @returns {AppError} Conflict error
 */
function createConflictError(message, details = {}) {
    return new AppError(message, ErrorTypes.CONFLICT, ErrorSeverity.MEDIUM, details);
}

/**
 * Create external service error
 * @param {string} service - Service name
 * @param {string} message - Error message
 * @param {Object} details - Error details
 * @returns {AppError} External service error
 */
function createExternalServiceError(service, message, details = {}) {
    return new AppError(
        `External service error (${service}): ${message}`,
        ErrorTypes.EXTERNAL,
        ErrorSeverity.HIGH,
        { service, ...details }
    );
}

/**
 * Create timeout error
 * @param {string} operation - Operation that timed out
 * @param {number} timeout - Timeout duration in milliseconds
 * @returns {AppError} Timeout error
 */
function createTimeoutError(operation, timeout) {
    return new AppError(
        `${operation} timed out after ${timeout}ms`,
        ErrorTypes.TIMEOUT,
        ErrorSeverity.MEDIUM,
        { operation, timeout }
    );
}

/**
 * Create network error
 * @param {string} message - Error message
 * @param {Object} details - Network error details
 * @returns {AppError} Network error
 */
function createNetworkError(message, details = {}) {
    return new AppError(message, ErrorTypes.NETWORK, ErrorSeverity.HIGH, details);
}

/**
 * Handle and log errors consistently
 * @param {Error} error - Error to handle
 * @param {string} context - Context where error occurred
 * @param {Object} options - Handling options
 */
function handleError(error, context = '', options = {}) {
    const {
        logLevel = 'error',
        includeStack = false,
        includeContext = true
    } = options;

    const errorInfo = {
        message: error.message,
        type: error.type || ErrorTypes.INTERNAL,
        severity: error.severity || ErrorSeverity.MEDIUM,
        context: includeContext ? context : undefined,
        timestamp: new Date().toISOString()
    };

    if (includeStack && error.stack) {
        errorInfo.stack = error.stack;
    }

    if (error.details) {
        errorInfo.details = error.details;
    }

    // Log based on severity
    switch (error.severity || ErrorSeverity.MEDIUM) {
        case ErrorSeverity.CRITICAL:
            console.error(`[CRITICAL] ${context}:`, errorInfo);
            break;
        case ErrorSeverity.HIGH:
            console.error(`[HIGH] ${context}:`, errorInfo);
            break;
        case ErrorSeverity.MEDIUM:
            console.warn(`[MEDIUM] ${context}:`, errorInfo);
            break;
        case ErrorSeverity.LOW:
            console.log(`[LOW] ${context}:`, errorInfo);
            break;
        default:
            console.error(`[UNKNOWN] ${context}:`, errorInfo);
    }

    return errorInfo;
}

/**
 * Convert error to HTTP response
 * @param {Error} error - Error to convert
 * @param {Object} res - Express response object
 * @returns {Object} HTTP response
 */
function sendErrorResponse(error, res) {
    let statusCode = 500;
    let responseBody = {
        error: {
            message: 'Internal server error',
            type: ErrorTypes.INTERNAL
        }
    };

    if (error instanceof AppError) {
        // Map error types to HTTP status codes
        switch (error.type) {
            case ErrorTypes.VALIDATION:
                statusCode = 400;
                break;
            case ErrorTypes.NOT_FOUND:
                statusCode = 404;
                break;
            case ErrorTypes.UNAUTHORIZED:
                statusCode = 401;
                break;
            case ErrorTypes.FORBIDDEN:
                statusCode = 403;
                break;
            case ErrorTypes.CONFLICT:
                statusCode = 409;
                break;
            case ErrorTypes.TIMEOUT:
                statusCode = 408;
                break;
            case ErrorTypes.NETWORK:
            case ErrorTypes.EXTERNAL:
                statusCode = 502;
                break;
            default:
                statusCode = 500;
        }

        responseBody = error.toJSON();
    } else if (error.name === 'ValidationError') {
        // Mongoose validation error
        statusCode = 400;
        responseBody = {
            error: {
                message: 'Validation failed',
                type: ErrorTypes.VALIDATION,
                details: Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }))
            }
        };
    } else if (error.name === 'CastError') {
        // Mongoose cast error (invalid ObjectId, etc.)
        statusCode = 400;
        responseBody = {
            error: {
                message: 'Invalid ID format',
                type: ErrorTypes.VALIDATION,
                details: { field: error.path, value: error.value }
            }
        };
    } else if (error.code === 11000) {
        // MongoDB duplicate key error
        statusCode = 409;
        responseBody = {
            error: {
                message: 'Duplicate entry',
                type: ErrorTypes.CONFLICT,
                details: { field: Object.keys(error.keyPattern)[0] }
            }
        };
    }

    return res.status(statusCode).json(responseBody);
}

/**
 * Async error wrapper for Express routes
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {AppError|null} Validation error or null
 */
function validateRequiredFields(body, requiredFields) {
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
        return createValidationError(
            `Missing required fields: ${missingFields.join(', ')}`,
            { missingFields }
        );
    }
    
    return null;
}

/**
 * Validate ObjectId format
 * @param {string} id - ID to validate
 * @param {string} fieldName - Field name for error message
 * @returns {AppError|null} Validation error or null
 */
function validateObjectId(id, fieldName = 'ID') {
    const mongoose = require('mongoose');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return createValidationError(
            `Invalid ${fieldName} format`,
            { field: fieldName, value: id }
        );
    }
    
    return null;
}

module.exports = {
    // Error types and severity
    ErrorTypes,
    ErrorSeverity,
    
    // Error classes
    AppError,
    
    // Error creators
    createValidationError,
    createNotFoundError,
    createUnauthorizedError,
    createForbiddenError,
    createConflictError,
    createExternalServiceError,
    createTimeoutError,
    createNetworkError,
    
    // Error handlers
    handleError,
    sendErrorResponse,
    asyncHandler,
    
    // Validation helpers
    validateRequiredFields,
    validateObjectId
}; 