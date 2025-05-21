const { describe, it, expect } = require('./test-helpers');
const Joi = require('../backend/utils/simpleJoi');

describe('simpleJoi', () => {
  it('validates strings with required and email', () => {
    const schema = Joi.string().required().email();
    expect(schema.validate('test@example.com')).toBe(null);
    expect(schema.validate('bad')).toBe('must be a valid email');
    expect(schema.validate()).toBe('is required');
  });

  it('object validation returns values and errors', () => {
    const objSchema = Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().min(3)
    });
    const res = objSchema.validate({ email: 'a@b.com', name: 'Bob' });
    expect(res.error).toBe(null);
    expect(res.value).toEqual({ email: 'a@b.com', name: 'Bob' });

    const bad = objSchema.validate({ email: 'bad', name: 'Al' });
    expect(bad.error.details.email).toBe('must be a valid email');
    expect(bad.error.details.name).toBe('length must be at least 3');
  });
});
