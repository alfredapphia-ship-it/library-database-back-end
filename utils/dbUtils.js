/**
 * Database Utilities
 * Common functions for optimized database operations
 */

/**
 * Build filter object from query parameters
 * @param {Object} queryParams - Query parameters from request
 * @param {Array} allowedFields - Fields allowed for filtering
 * @returns {Object} Filter object for MongoDB
 */
function buildFilter(queryParams, allowedFields) {
  const filter = {};
  
  allowedFields.forEach(field => {
    if (queryParams[field] !== undefined) {
      const value = queryParams[field];
      
      // Handle boolean fields
      if (value === 'true') {
        filter[field] = true;
      } else if (value === 'false') {
        filter[field] = false;
      } else {
        filter[field] = value;
      }
    }
  });
  
  return filter;
}

/**
 * Build search filter with regex
 * @param {string} searchTerm - Search term
 * @param {Array} searchFields - Fields to search in
 * @returns {Object} MongoDB search filter
 */
function buildSearchFilter(searchTerm, searchFields) {
  if (!searchTerm) return {};
  
  return {
    $or: searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
}

/**
 * Get pagination parameters
 * @param {Object} query - Query object from request
 * @returns {Object} { page, limit, skip }
 */
function getPaginationParams(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

/**
 * Format pagination response
 * @param {Array} data - Result data
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Formatted pagination response
 */
function formatPaginationResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Handle database errors consistently
 * @param {Error} error - Error object
 * @param {Object} res - Express response object
 */
function handleDBError(error, res) {
  console.error('Database error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: error.message });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }
  
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(400).json({ error: `${field} must be unique` });
  }
  
  return res.status(500).json({ error: 'Database operation failed', message: error.message });
}

/**
 * Validate ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid MongoDB ObjectId
 */
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Create optimized query with common settings
 * @param {Object} model - Mongoose model
 * @param {Object} filter - Filter object
 * @param {Object} options - Query options { select, lean, sort }
 * @returns {Query} Mongoose query
 */
function createOptimizedQuery(model, filter, options = {}) {
  let query = model.find(filter);
  
  if (options.select) {
    query = query.select(options.select);
  }
  
  if (options.lean) {
    query = query.lean();
  }
  
  if (options.sort) {
    query = query.sort(options.sort);
  }
  
  return query;
}

module.exports = {
  buildFilter,
  buildSearchFilter,
  getPaginationParams,
  formatPaginationResponse,
  handleDBError,
  isValidObjectId,
  createOptimizedQuery
};
