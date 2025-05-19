/**
 * Utility for formatting API responses consistently
 */
class ResponseFormatter {
    // Format a successful response
    success(res, data = {}, message = 'Success', statusCode = 200) {
      return res.status(statusCode).json({
        success: true,
        message,
        data
      });
    }
  
    // Format an error response
    error(res, message = 'An error occurred', statusCode = 400, errors = null) {
      const response = {
        success: false,
        message
      };
      
      if (errors) {
        response.errors = errors;
      }
      
      return res.status(statusCode).json(response);
    }
  
    // Format a validation error response
    validationError(res, errors) {
      return this.error(
        res,
        'Validation error',
        400,
        errors
      );
    }
  
    // Format an authentication error response
    authError(res, message = 'Authentication failed') {
      return this.error(
        res,
        message,
        401
      );
    }
  
    // Format an authorization error response
    forbidden(res, message = 'Not authorized to access this resource') {
      return this.error(
        res,
        message,
        403
      );
    }
  
    // Format a not found error response
    notFound(res, message = 'Resource not found') {
      return this.error(
        res,
        message,
        404
      );
    }
  
    // Format a conflict error response (e.g., duplicate resource)
    conflict(res, message = 'Resource already exists') {
      return this.error(
        res,
        message,
        409
      );
    }
  
    // Format a server error response
    serverError(res, message = 'Internal server error') {
      return this.error(
        res,
        message,
        500
      );
    }
  
    // Format a paginated response
    paginated(res, data, page, limit, total, message = 'Success') {
      const totalPages = Math.ceil(total / limit);
      
      return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    }
  
    // Format a created response (201)
    created(res, data = {}, message = 'Resource created successfully') {
      return this.success(res, data, message, 201);
    }
  
    // Format a no content response (204)
    noContent(res) {
      return res.status(204).end();
    }
  
    // Format a custom response
    custom(res, statusCode, data) {
      return res.status(statusCode).json(data);
    }
  }
  
  module.exports = new ResponseFormatter();