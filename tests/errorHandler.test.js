import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../backend/utils/logger', () => ({
  default: { error: vi.fn() },
  error: vi.fn(),
}));

const responseFormatter = require('../backend/utils/responseFormatter');
vi.spyOn(responseFormatter, 'validationError');
vi.spyOn(responseFormatter, 'authError');
vi.spyOn(responseFormatter, 'forbidden');
vi.spyOn(responseFormatter, 'notFound');
vi.spyOn(responseFormatter, 'conflict');
vi.spyOn(responseFormatter, 'error');
vi.spyOn(responseFormatter, 'serverError');

const errorHandler = require('../backend/middlewares/errorHandler');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  AppError
} = require('../backend/utils/errorTypes');

function run(err) {
  const req = { path:'/p', method:'GET' };
  const res = {};
  const next = vi.fn();
  errorHandler(err, req, res, next);
}

describe('errorHandler middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles ValidationError', () => {
    run(new ValidationError('bad',{a:'b'}));
    expect(responseFormatter.validationError).toHaveBeenCalledWith({}, {a:'b'});
  });

  it('handles AuthenticationError', () => {
    run(new AuthenticationError('no'));
    expect(responseFormatter.authError).toHaveBeenCalledWith({}, 'no');
  });

  it('handles AuthorizationError', () => {
    run(new AuthorizationError('no'));
    expect(responseFormatter.forbidden).toHaveBeenCalledWith({}, 'no');
  });

  it('handles NotFoundError', () => {
    run(new NotFoundError('no'));
    expect(responseFormatter.notFound).toHaveBeenCalledWith({}, 'no');
  });

  it('handles ConflictError', () => {
    run(new ConflictError('no'));
    expect(responseFormatter.conflict).toHaveBeenCalledWith({}, 'no');
  });

  it('handles AppError fallback', () => {
    run(new AppError('oops',418));
    expect(responseFormatter.error).toHaveBeenCalledWith({}, 'oops', 418);
  });

  it('handles mongoose ValidationError name', () => {
    run({ name:'ValidationError', errors:{ field:{ message:'e' } } });
    expect(responseFormatter.validationError).toHaveBeenCalledWith({}, { field:'e' });
  });

  it('handles duplicate key error code 11000', () => {
    run({ code:11000 });
    expect(responseFormatter.conflict).toHaveBeenCalled();
  });

  it('handles JWT errors', () => {
    run({ name:'JsonWebTokenError' });
    expect(responseFormatter.authError).toHaveBeenCalledWith({}, 'Invalid token');
  });

  it('handles TokenExpiredError', () => {
    run({ name:'TokenExpiredError' });
    expect(responseFormatter.authError).toHaveBeenCalledWith({}, 'Token expired');
  });

  it('handles generic error', () => {
    run(new Error('x'));
    expect(responseFormatter.serverError).toHaveBeenCalled();
  });
});
