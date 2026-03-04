const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { schemas } = require('../utils/validationUtils');

const registerSchema = schemas.user.register;
const loginSchema = schemas.user.login;

class AuthService {
    /**
     * Register a new user
     * @param {Object} userData - User registration data
     * @returns {Object} User and token
     */
    static async register(userData) {
        const { error, value } = registerSchema.validate(userData);
        if (error) {
            throw new Error(error.details[0].message);
        }

        const { email, password, firstName, lastName } = value;

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const user = new User({
            email,
            password,
            firstName,
            lastName,
            role: 'admin'
        });

        await user.save();

        const token = generateToken(user);

        return {
            user: user.getProfile(),
            token
        };
    }

    /**
     * Login user
     * @param {Object} loginData - Login credentials
     * @returns {Object} User and token
     */
    static async login(loginData) {
        const { error, value } = loginSchema.validate(loginData);
        if (error) {
            throw new Error(error.details[0].message);
        }

        const { email, password } = value;

        const user = await User.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
            throw new Error('Account is deactivated. Please contact support.');
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);

        return {
            user: user.getProfile(),
            token
        };
    }

    /**
     * Get user profile
     * @param {String} userId - User ID
     * @returns {Object} User profile
     */
    static async getProfile(userId) {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            throw new Error('User not found');
        }

        return user.getProfile();
    }

    /**
     * Update user profile
     * @param {String} userId - User ID
     * @param {Object} updateData - Profile update data
     * @returns {Object} Updated user profile
     */
    static async updateProfile(userId, updateData) {
        const allowedUpdates = ['firstName', 'lastName'];
        const updates = {};

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
    }

    /**
     * Change user password
     * @param {String} userId - User ID
     * @param {String} currentPassword - Current password
     * @param {String} newPassword - New password
     * @returns {Boolean} Success status
     */
    static async changePassword(userId, currentPassword, newPassword) {
        if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        user.password = newPassword;
        await user.save();

        return true;
    }

    /**
     * Create superadmin user (for initial setup)
     * @param {Object} userData - Superadmin data
     * @returns {Object} User and token
     */
    static async createSuperAdmin(userData) {
        const { error, value } = registerSchema.validate(userData);
        if (error) {
            throw new Error(error.details[0].message);
        }

        const { email, password, firstName, lastName } = value;

        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
        if (existingSuperAdmin) {
            throw new Error('Superadmin already exists');
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const user = new User({
            email,
            password,
            firstName,
            lastName,
            role: 'superadmin'
        });

        await user.save();

        const token = generateToken(user);

        return {
            user: user.getProfile(),
            token
        };
    }

    /**
     * Get all users (superadmin only)
     * @param {Object} options - Query options
     * @returns {Object} Users list and pagination info
     */
    static async getAllUsers(options = {}) {
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
    }
}

module.exports = AuthService;
