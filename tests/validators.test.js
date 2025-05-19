const { describe, it, expect, vi } = require('./test-helpers');

vi.mock('express-validator', () => {
  const chain = new Proxy(function() {}, {
    get: () => chain,
    apply: () => chain
  });
  const makeChain = () => chain;
  return {
    validationResult: vi.fn(),
    body: makeChain,
    param: makeChain,
    query: makeChain
  };
});

const { ValidationError } = require('../backend/utils/errorTypes');
const { validate } = require('../backend/utils/validators');
const { validationResult } = require('express-validator');

describe('validate middleware', () => {
  it('calls next when no errors', () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const next = vi.fn();
    validate({}, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('throws ValidationError with formatted errors', () => {
    const array = () => [
      { param: 'email', msg: 'Invalid email' },
      { param: 'password', msg: 'too short' }
    ];
    validationResult.mockReturnValue({ isEmpty: () => false, array });
    expect(() => validate({}, {}, () => {})).toThrow(ValidationError);
    try {
      validate({}, {}, () => {});
    } catch (e) {
      expect(e.errors).toEqual({ email: 'Invalid email', password: 'too short' });
    }
  });
});
