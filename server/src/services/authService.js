const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
    })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Object} User and token
     */
    static async register(userData) {
        try {
            // Validate input data
            const { error, value } = registerSchema.validate(userData);
            if (error) {
                throw new Error(error.details[0].message);
            }

            const { email, password, firstName, lastName } = value;

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Create new user
            const user = new User({
                email,
                password,
                firstName,
                lastName,
                role: 'admin' // All users are admin by default
            });

            await user.save();

            // Generate token
            const token = generateToken(user);

            // Return user profile and token
            return {
                user: user.getProfile(),
                token
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Login user
     * @param {Object} loginData - Login credentials
     * @returns {Object} User and token
     */
    static async login(loginData) {
        try {
            // Validate input data
            const { error, value } = loginSchema.validate(loginData);
            if (error) {
                throw new Error(error.details[0].message);
            }

            const { email, password } = value;

            // Find user by email
            const user = await User.findByEmail(email);
            if (!user) {
                throw new Error('Invalid email or password');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is deactivated. Please contact support.');
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                throw new Error('Invalid email or password');
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate token
            const token = generateToken(user);

            // Return user profile and token
            return {
                user: user.getProfile(),
                token
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user profile
     * @param {String} userId - User ID
     * @returns {Object} User profile
     */
    static async getProfile(userId) {
        try {
            const user = await User.findById(userId).select('-password');
            if (!user) {
                throw new Error('User not found');
            }

            return user.getProfile();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update user profile
     * @param {String} userId - User ID
     * @param {Object} updateData - Profile update data
     * @returns {Object} Updated user profile
     */
    static async updateProfile(userId, updateData) {
        try {
            const allowedUpdates = ['firstName', 'lastName'];
            const updates = {};

            // Only allow certain fields to be updated
            Object.keys(updateData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = updateData[key];
                }
            });

            const user = await User.findByIdAndUpdate(
                userId, 
                updates, 
                { new: true, runValidators: true }
            ).select('-password');

            if (!user) {
                throw new Error('User not found');
            }

            return user.getProfile();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Change user password
     * @param {String} userId - User ID
     * @param {String} currentPassword - Current password
     * @param {String} newPassword - New password
     * @returns {Boolean} Success status
     */
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            if (!newPassword || newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters long');
            }

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isCurrentPasswordValid = await user.comparePassword(currentPassword);
            if (!isCurrentPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Update password
            user.password = newPassword;
            await user.save();

            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create superadmin user (for initial setup)
     * @param {Object} userData - Superadmin data
     * @returns {Object} User and token
     */
    static async createSuperAdmin(userData) {
        try {
            const { error, value } = registerSchema.validate(userData);
            if (error) {
                throw new Error(error.details[0].message);
            }

            const { email, password, firstName, lastName } = value;

            // Check if superadmin already exists
            const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
            if (existingSuperAdmin) {
                throw new Error('Superadmin already exists');
            }

            // Check if user with email already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Create superadmin user
            const user = new User({
                email,
                password,
                firstName,
                lastName,
                role: 'superadmin'
            });

            await user.save();

            // Generate token
            const token = generateToken(user);

            return {
                user: user.getProfile(),
                token
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all users (superadmin only)
     * @param {Object} options - Query options
     * @returns {Object} Users list and pagination info
     */
    static async getAllUsers(options = {}) {
        try {
            const { page = 1, limit = 10, search = '' } = options;
            const skip = (page - 1) * limit;

            let query = {};
            if (search) {
                query = {
                    $or: [
                        { firstName: { $regex: search, $options: 'i' } },
                        { lastName: { $regex: search, $options: 'i' } },
                        { email: { $regex: search, $options: 'i' } }
                    ]
                };
            }

            const users = await User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await User.countDocuments(query);

            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = AuthService;
