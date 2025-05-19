const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  ExternalServiceError
} = require('../backend/utils/errorTypes');

describe('Error Types', () => {
  it('should set default properties in AppError', () => {
    const err = new AppError('msg', 418);
    expect(err.message).toBe('msg');
    expect(err.statusCode).toBe(418);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
  });

  it('ValidationError should inherit from AppError with defaults', () => {
    const err = new ValidationError();
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Validation error');
    expect(err.errors).toEqual({});
  });

  it('AuthenticationError should set status 401', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Authentication error');
  });

  it('AuthorizationError should set status 403', () => {
    const err = new AuthorizationError('nope');
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('nope');
  });

  it('NotFoundError should default 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it('ConflictError should default 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });

  it('RateLimitError should default 429', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
  });

  it('ServerError should default 500', () => {
    const err = new ServerError();
    expect(err.statusCode).toBe(500);
  });

  it('ExternalServiceError should capture service name', () => {
    const err = new ExternalServiceError(undefined, 'zoom');
    expect(err.service).toBe('zoom');
    expect(err.statusCode).toBe(502);
  });
});
