const mongoose = require('mongoose')
const { createValidationError, createNotFoundError, sendErrorResponse } = require('../utils/errorHandler')

/**
 * Base controller class providing common CRUD operations and error handling
 */
class BaseController {
  constructor(model) {
    this.model = model
  }

  /**
   * Validate ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean} Whether ID is valid
   */
  validateObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id)
  }

  /**
   * Create validation error response
   * @param {string} message - Error message
   * @param {Object} res - Express response object
   */
  handleValidationError(message, res) {
    const error = createValidationError(message)
    return sendErrorResponse(error, res)
  }

  /**
   * Create not found error response
   * @param {string} message - Error message
   * @param {Object} res - Express response object
   */
  handleNotFoundError(message, res) {
    const error = createNotFoundError(message)
    return sendErrorResponse(error, res)
  }

  /**
   * Generic error handler
   * @param {Error} error - Error object
   * @param {Object} res - Express response object
   * @param {string} defaultMessage - Default error message
   */
  handleError(error, res, defaultMessage = 'An error occurred') {
    console.error('Controller error:', error)
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(err => err.message).join(', ')
      return this.handleValidationError(message, res)
    }
    
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return this.handleValidationError('Invalid ID format', res)
    }
    
    const message = error.message || defaultMessage
    return res.status(500).json({ message, error: message })
  }

  /**
   * Get all records with pagination and search
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAll(req, res) {
    try {
      const { search, page = 1, limit = 100, sort, ...filters } = req.query
      
      // Build query
      let query = { ...filters }
      
      // Add search functionality if search field is specified
      if (search && this.searchFields) {
        const searchQuery = { $regex: search, $options: 'i' }
        query.$or = this.searchFields.map(field => ({ [field]: searchQuery }))
      }
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit)
      
      // Build sort object
      let sortObj = {}
      if (sort) {
        const [field, order] = sort.split(':')
        sortObj[field] = order === 'desc' ? -1 : 1
      } else {
        sortObj = { createdAt: -1 } // Default sort
      }
      
      // Execute query
      const [data, total] = await Promise.all([
        this.model.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .select('-__v'),
        this.model.countDocuments(query)
      ])
      
      res.json({
        data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      })
    } catch (error) {
      this.handleError(error, res, 'Error fetching records')
    }
  }

  /**
   * Get single record by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getById(req, res) {
    try {
      const { id } = req.params
      
      if (!this.validateObjectId(id)) {
        return this.handleValidationError('Invalid ID format', res)
      }
      
      const data = await this.model.findById(id).select('-__v')
      
      if (!data) {
        return this.handleNotFoundError('Record not found', res)
      }
      
      res.json(data)
    } catch (error) {
      this.handleError(error, res, 'Error fetching record')
    }
  }

  /**
   * Create new record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async create(req, res) {
    try {
      const data = new this.model(req.body)
      const savedData = await data.save()
      
      res.status(201).json({
        message: 'Record created successfully',
        data: savedData
      })
    } catch (error) {
      this.handleError(error, res, 'Error creating record')
    }
  }

  /**
   * Update record by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async update(req, res) {
    try {
      const { id } = req.params
      
      if (!this.validateObjectId(id)) {
        return this.handleValidationError('Invalid ID format', res)
      }
      
      const data = await this.model.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      ).select('-__v')
      
      if (!data) {
        return this.handleNotFoundError('Record not found', res)
      }
      
      res.json({
        message: 'Record updated successfully',
        data
      })
    } catch (error) {
      this.handleError(error, res, 'Error updating record')
    }
  }

  /**
   * Delete record by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async delete(req, res) {
    try {
      const { id } = req.params
      
      if (!this.validateObjectId(id)) {
        return this.handleValidationError('Invalid ID format', res)
      }
      
      const data = await this.model.findByIdAndDelete(id)
      
      if (!data) {
        return this.handleNotFoundError('Record not found', res)
      }
      
      res.json({
        message: 'Record deleted successfully'
      })
    } catch (error) {
      this.handleError(error, res, 'Error deleting record')
    }
  }

  /**
   * Bulk delete records
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async bulkDelete(req, res) {
    try {
      const { ids } = req.body
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return this.handleValidationError('IDs array is required', res)
      }
      
      // Validate all IDs
      const invalidIds = ids.filter(id => !this.validateObjectId(id))
      if (invalidIds.length > 0) {
        return this.handleValidationError('Invalid ID format in array', res)
      }
      
      const result = await this.model.deleteMany({ _id: { $in: ids } })
      
      res.json({
        message: `${result.deletedCount} records deleted successfully`,
        deletedCount: result.deletedCount
      })
    } catch (error) {
      this.handleError(error, res, 'Error deleting records')
    }
  }

  /**
   * Get record count
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCount(req, res) {
    try {
      const { ...filters } = req.query
      const count = await this.model.countDocuments(filters)
      
      res.json({ count })
    } catch (error) {
      this.handleError(error, res, 'Error getting count')
    }
  }
}

module.exports = BaseController 