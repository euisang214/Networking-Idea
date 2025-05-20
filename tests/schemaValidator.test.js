const { describe, it, expect, vi } = require('./test-helpers');
const celebrate = require('../backend/middlewares/schemaValidator');
const { ValidationError } = require('../backend/utils/errorTypes');
const Joi = celebrate.Joi;

describe('schemaValidator middleware', () => {
  it('passes validated values and calls next', () => {
    const validator = celebrate({ body: Joi.object({ email: Joi.string().email().required() }) });
    const req = { body: { email: 'test@test.com' } };
    const next = vi.fn();
    validator(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes ValidationError to next on invalid input', () => {
    const validator = celebrate({ body: Joi.object({ email: Joi.string().email().required() }) });
    const req = { body: { email: 'bad' } };
    const next = vi.fn();
    validator(req, {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
  });
});
