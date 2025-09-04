const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const AuthService = require('../services/authService');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        code: 'TOO_MANY_ATTEMPTS'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        code: 'TOO_MANY_ATTEMPTS'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req, res) => {
    try {
        const result = await AuthService.register(req.body);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'REGISTRATION_FAILED'
        });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', strictAuthLimiter, async (req, res) => {
    try {
        const result = await AuthService.login(req.body);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            success: false,
            error: error.message,
            code: 'LOGIN_FAILED'
        });
    }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        // In a more sophisticated setup, you might want to blacklist the token
        // For now, we'll just return success and let the client handle token removal
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed',
            code: 'LOGOUT_FAILED'
        });
    }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        const profile = await AuthService.getProfile(req.user._id);
        
        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get profile',
            code: 'PROFILE_FETCH_FAILED'
        });
    }
});

/**
 * PUT /api/auth/profile
 * Update current user profile
 */
router.put('/profile', authenticate, async (req, res) => {
    try {
        const profile = await AuthService.updateProfile(req.user._id, req.body);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: profile
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'PROFILE_UPDATE_FAILED'
        });
    }
});

/**
 * PUT /api/auth/change-password
 * Change user password
 */
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required',
                code: 'MISSING_PASSWORDS'
            });
        }

        await AuthService.changePassword(req.user._id, currentPassword, newPassword);
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'PASSWORD_CHANGE_FAILED'
        });
    }
});

/**
 * POST /api/auth/create-superadmin
 * Create superadmin user (superadmin only)
 */
router.post('/create-superadmin', authenticate, requireSuperAdmin, async (req, res) => {
    try {
        const result = await AuthService.createSuperAdmin(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Superadmin created successfully',
            data: result
        });
    } catch (error) {
        console.error('Create superadmin error:', error);
        res.status(400).json({
            success: false,
            error: error.message,
            code: 'SUPERADMIN_CREATION_FAILED'
        });
    }
});

/**
 * GET /api/auth/users
 * Get all users (superadmin only)
 */
router.get('/users', authenticate, requireSuperAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const result = await AuthService.getAllUsers({ page, limit, search });
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get users',
            code: 'USERS_FETCH_FAILED'
        });
    }
});

/**
 * GET /api/auth/verify
 * Verify token and get user info
 */
router.get('/verify', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user.getProfile()
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            error: 'Invalid token',
            code: 'TOKEN_VERIFICATION_FAILED'
        });
    }
});

module.exports = router;
