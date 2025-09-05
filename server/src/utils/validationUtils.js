const Joi = require('joi');
const mongoose = require('mongoose');

/**
 * Common validation schemas
 */
const commonSchemas = {
    objectId: Joi.string().custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid');
        }
        return value;
    }, 'ObjectId validation'),

    email: Joi.string().email().lowercase().trim().required(),

    password: Joi.string().min(6).required(),

    url: Joi.string().uri().required(),

    domain: Joi.string().hostname().required(),

    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    })
};

/**
 * Validation schemas for different entities
 */
const schemas = {
    // User validation
    user: {
        register: Joi.object({
            email: commonSchemas.email,
            password: commonSchemas.password,
            confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
            firstName: Joi.string().min(2).max(50).trim().required(),
            lastName: Joi.string().min(2).max(50).trim().required()
        }),

        login: Joi.object({
            email: commonSchemas.email,
            password: commonSchemas.password
        }),

        update: Joi.object({
            firstName: Joi.string().min(2).max(50).trim(),
            lastName: Joi.string().min(2).max(50).trim(),
            email: commonSchemas.email
        }),

        changePassword: Joi.object({
            currentPassword: commonSchemas.password,
            newPassword: commonSchemas.password,
            confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
        })
    },

    // Crawl validation
    crawl: {
        create: Joi.object({
            title: Joi.string().min(1).max(100).trim().required(),
            urls: Joi.array().items(commonSchemas.url).min(1).required(),
            selectors: Joi.array().items(Joi.object({
                name: Joi.string().required(),
                css: Joi.string().required(),
                type: Joi.string().valid('text', 'link', 'image', 'attribute').default('text'),
                attribute: Joi.string().allow(null)
            })).default([]),
            disabled: Joi.boolean().default(false)
        }),

        update: Joi.object({
            title: Joi.string().min(1).max(100).trim(),
            urls: Joi.array().items(commonSchemas.url).min(1),
            selectors: Joi.array().items(Joi.object({
                name: Joi.string().required(),
                css: Joi.string().required(),
                type: Joi.string().valid('text', 'link', 'image', 'attribute').default('text'),
                attribute: Joi.string().allow(null)
            })),
            disabled: Joi.boolean()
        }),

        start: Joi.object({
            urls: Joi.array().items(commonSchemas.url).min(1).required(),
            crawlId: commonSchemas.objectId.required(),
            selectors: Joi.array().items(Joi.object({
                name: Joi.string().required(),
                css: Joi.string().required(),
                type: Joi.string().valid('text', 'link', 'image', 'attribute').default('text'),
                attribute: Joi.string().allow(null)
            })).default([])
        })
    },

    // Query validation
    query: {
        pagination: commonSchemas.pagination,
        search: Joi.object({
            search: Joi.string().min(1).max(100).trim()
        }),
        dateRange: Joi.object({
            startDate: Joi.date().iso(),
            endDate: Joi.date().iso().min(Joi.ref('startDate'))
        })
    }
};

/**
 * Validation middleware factory
 * @param {Object} schema - Joi schema
 * @param {string} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors
            });
        }

        req[property] = value;
        next();
    };
};

/**
 * Validate ObjectId parameter
 * @param {string} paramName - Parameter name
 */
const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: `Invalid ${paramName}`,
                code: 'INVALID_ID'
            });
        }

        next();
    };
};

module.exports = {
    schemas,
    validate,
    validateObjectId,
    commonSchemas
};
