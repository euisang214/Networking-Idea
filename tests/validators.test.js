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
const validate = require('../backend/utils/validation/middleware');
const { validationResult } = require('express-validator');

describe('validate middleware', () => {
  it('calls next when no errors', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const next = vi.fn();
    const mw = validate([]);
    await mw({}, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('throws ValidationError with formatted errors', async () => {
    const array = () => [
      { param: 'email', msg: 'Invalid email' },
      { param: 'password', msg: 'too short' }
    ];
    validationResult.mockReturnValue({ isEmpty: () => false, array });
    const mw = validate([]);
    try {
      await mw({}, {}, () => {});
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.errors).toEqual({ email: 'Invalid email', password: 'too short' });
    }
  });
});
