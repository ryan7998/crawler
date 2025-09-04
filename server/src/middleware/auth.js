const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createUnauthorizedError } = require('../utils/errorHandler');

// JWT Secret - should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
    };
    
    return jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'crawler-app',
        audience: 'crawler-users'
    });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'crawler-app',
            audience: 'crawler-users'
        });
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request object
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                error: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        // Extract token from "Bearer <token>"
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. Invalid token format.',
                code: 'INVALID_TOKEN_FORMAT'
            });
        }

        // Verify token
        const decoded = verifyToken(token);
        
        // Get user from database to ensure they still exist and are active
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                error: 'Access denied. User not found.',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                error: 'Access denied. Account is deactivated.',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        // Add user to request object
        req.user = user;
        next();
        
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({
            error: 'Access denied. Invalid token.',
            code: 'INVALID_TOKEN',
            details: error.message
        });
    }
};

/**
 * Authorization middleware for superadmin only
 */
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Access denied. Authentication required.',
            code: 'AUTHENTICATION_REQUIRED'
        });
    }

    if (!req.user.isSuperAdmin()) {
        return res.status(403).json({
            error: 'Access denied. Superadmin privileges required.',
            code: 'SUPERADMIN_REQUIRED'
        });
    }

    next();
};

/**
 * Authorization middleware for admin or superadmin
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Access denied. Authentication required.',
            code: 'AUTHENTICATION_REQUIRED'
        });
    }

    if (!req.user.isAdmin()) {
        return res.status(403).json({
            error: 'Access denied. Admin privileges required.',
            code: 'ADMIN_REQUIRED'
        });
    }

    next();
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return next();
        }

        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            return next();
        }

        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isActive) {
            req.user = user;
        }
        
        next();
        
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};

module.exports = {
    generateToken,
    verifyToken,
    authenticate,
    requireSuperAdmin,
    requireAdmin,
    optionalAuth
};
