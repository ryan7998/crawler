/**
 * Base service class providing common CRUD operations and utility methods
 * Reduces code duplication across service classes
 */
class BaseService {
    constructor(model) {
        this.model = model;
    }

    /**
     * Create a new document
     * @param {Object} data - Document data
     * @returns {Promise<Object>} Created document
     */
    async create(data) {
        try {
            const document = new this.model(data);
            return await document.save();
        } catch (error) {
            this.handleError('create', error);
        }
    }

    /**
     * Find document by ID
     * @param {string} id - Document ID
     * @param {Object} options - Query options (populate, select, etc.)
     * @returns {Promise<Object|null>} Found document
     */
    async findById(id, options = {}) {
        try {
            let query = this.model.findById(id);
            
            if (options.populate) {
                query = query.populate(options.populate);
            }
            
            if (options.select) {
                query = query.select(options.select);
            }
            
            return await query.exec();
        } catch (error) {
            this.handleError('findById', error);
        }
    }

    /**
     * Find documents by criteria
     * @param {Object} criteria - Search criteria
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Found documents
     */
    async find(criteria = {}, options = {}) {
        try {
            let query = this.model.find(criteria);
            
            if (options.populate) {
                query = query.populate(options.populate);
            }
            
            if (options.select) {
                query = query.select(options.select);
            }
            
            if (options.sort) {
                query = query.sort(options.sort);
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            if (options.skip) {
                query = query.skip(options.skip);
            }
            
            return await query.exec();
        } catch (error) {
            this.handleError('find', error);
        }
    }

    /**
     * Find one document by criteria
     * @param {Object} criteria - Search criteria
     * @param {Object} options - Query options
     * @returns {Promise<Object|null>} Found document
     */
    async findOne(criteria = {}, options = {}) {
        try {
            let query = this.model.findOne(criteria);
            
            if (options.populate) {
                query = query.populate(options.populate);
            }
            
            if (options.select) {
                query = query.select(options.select);
            }
            
            return await query.exec();
        } catch (error) {
            this.handleError('findOne', error);
        }
    }

    /**
     * Update document by ID
     * @param {string} id - Document ID
     * @param {Object} data - Update data
     * @param {Object} options - Update options
     * @returns {Promise<Object|null>} Updated document
     */
    async updateById(id, data, options = {}) {
        try {
            const updateOptions = {
                new: true,
                runValidators: true,
                ...options
            };
            
            return await this.model.findByIdAndUpdate(id, data, updateOptions);
        } catch (error) {
            this.handleError('updateById', error);
        }
    }

    /**
     * Update documents by criteria
     * @param {Object} criteria - Search criteria
     * @param {Object} data - Update data
     * @param {Object} options - Update options
     * @returns {Promise<Object>} Update result
     */
    async updateMany(criteria, data, options = {}) {
        try {
            const updateOptions = {
                runValidators: true,
                ...options
            };
            
            return await this.model.updateMany(criteria, data, updateOptions);
        } catch (error) {
            this.handleError('updateMany', error);
        }
    }

    /**
     * Delete document by ID
     * @param {string} id - Document ID
     * @returns {Promise<Object|null>} Deleted document
     */
    async deleteById(id) {
        try {
            return await this.model.findByIdAndDelete(id);
        } catch (error) {
            this.handleError('deleteById', error);
        }
    }

    /**
     * Delete documents by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<Object>} Delete result
     */
    async deleteMany(criteria) {
        try {
            return await this.model.deleteMany(criteria);
        } catch (error) {
            this.handleError('deleteMany', error);
        }
    }

    /**
     * Count documents by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Promise<number>} Document count
     */
    async count(criteria = {}) {
        try {
            return await this.model.countDocuments(criteria);
        } catch (error) {
            this.handleError('count', error);
        }
    }

    /**
     * Execute aggregation pipeline
     * @param {Array} pipeline - Aggregation pipeline
     * @returns {Promise<Array>} Aggregation results
     */
    async aggregate(pipeline) {
        try {
            return await this.model.aggregate(pipeline);
        } catch (error) {
            this.handleError('aggregate', error);
        }
    }

    /**
     * Paginate results
     * @param {Object} criteria - Search criteria
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Paginated results
     */
    async paginate(criteria = {}, options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                sort = { createdAt: -1 },
                populate,
                select
            } = options;

            const skip = (page - 1) * limit;
            
            let query = this.model.find(criteria);
            
            if (populate) {
                query = query.populate(populate);
            }
            
            if (select) {
                query = query.select(select);
            }
            
            const [documents, total] = await Promise.all([
                query.sort(sort).skip(skip).limit(limit).exec(),
                this.model.countDocuments(criteria)
            ]);

            return {
                documents,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            };
        } catch (error) {
            this.handleError('paginate', error);
        }
    }

    /**
     * Bulk create documents
     * @param {Array} documents - Array of document data
     * @returns {Promise<Array>} Created documents
     */
    async bulkCreate(documents) {
        try {
            return await this.model.insertMany(documents);
        } catch (error) {
            this.handleError('bulkCreate', error);
        }
    }

    /**
     * Bulk update documents
     * @param {Array} operations - Array of update operations
     * @returns {Promise<Object>} Bulk write result
     */
    async bulkUpdate(operations) {
        try {
            return await this.model.bulkWrite(operations);
        } catch (error) {
            this.handleError('bulkUpdate', error);
        }
    }

    /**
     * Handle service errors consistently
     * @param {string} operation - Operation name
     * @param {Error} error - Error object
     */
    handleError(operation, error) {
        console.error(`[${this.constructor.name}] Error in ${operation}:`, error);
        
        // Re-throw the error for proper handling by calling code
        throw error;
    }

    /**
     * Validate ObjectId format
     * @param {string} id - ID to validate
     * @returns {boolean} Whether ID is valid
     */
    isValidId(id) {
        return this.model.base.Types.ObjectId.isValid(id);
    }

    /**
     * Convert string to ObjectId
     * @param {string} id - String ID
     * @returns {ObjectId} ObjectId instance
     */
    toObjectId(id) {
        return new this.model.base.Types.ObjectId(id);
    }
}

module.exports = BaseService; 