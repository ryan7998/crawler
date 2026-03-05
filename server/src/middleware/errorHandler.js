const { AppError, ErrorTypes, ErrorSeverity } = require('../utils/errorHandler');

/**
 * Centralized error handling middleware
 * Handles all errors in a consistent way across the application
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, ErrorTypes.NOT_FOUND, ErrorSeverity.LOW);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = new AppError(message, ErrorTypes.CONFLICT, ErrorSeverity.MEDIUM);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = new AppError(message, ErrorTypes.BAD_REQUEST, ErrorSeverity.LOW);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new AppError(message, ErrorTypes.UNAUTHORIZED, ErrorSeverity.MEDIUM);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new AppError(message, ErrorTypes.UNAUTHORIZED, ErrorSeverity.MEDIUM);
    }

    // Default to 500 server error
    if (!error.statusCode) {
        error = new AppError('Internal Server Error', ErrorTypes.INTERNAL, ErrorSeverity.HIGH);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
        code: error.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Async error handler wrapper
 * Catches async errors and passes them to error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
    const error = new AppError(`Route ${req.originalUrl} not found`, ErrorTypes.NOT_FOUND, ErrorSeverity.LOW);
    next(error);
};

module.exports = {
    errorHandler,
    asyncHandler,
    notFound
};
