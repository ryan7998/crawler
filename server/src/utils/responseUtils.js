/**
 * Standardized response utilities for consistent API responses
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
    const response = {
        success: true,
        message,
        ...(data && { data })
    };

    return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {*} details - Additional error details
 */
const sendError = (res, message, code = 'ERROR', statusCode = 500, details = null) => {
    const response = {
        success: false,
        error: message,
        code,
        ...(details && { details })
    };

    return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {Array} errors - Validation errors array
 */
const sendValidationError = (res, message = 'Validation failed', errors = []) => {
    return res.status(400).json({
        success: false,
        error: message,
        code: 'VALIDATION_ERROR',
        errors
    });
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
const sendNotFound = (res, resource = 'Resource') => {
    return res.status(404).json({
        success: false,
        error: `${resource} not found`,
        code: 'NOT_FOUND'
    });
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
const sendUnauthorized = (res, message = 'Access denied') => {
    return res.status(401).json({
        success: false,
        error: message,
        code: 'UNAUTHORIZED'
    });
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
const sendForbidden = (res, message = 'Access forbidden') => {
    return res.status(403).json({
        success: false,
        error: message,
        code: 'FORBIDDEN'
    });
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 */
const sendPaginated = (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalItems,
            itemsPerPage: pagination.itemsPerPage
        }
    });
};

module.exports = {
    sendSuccess,
    sendError,
    sendValidationError,
    sendNotFound,
    sendUnauthorized,
    sendForbidden,
    sendPaginated
};
