class JoiString {
  constructor() { this.tests = []; this.req = false; }
  required() { this.req = true; return this; }
  email() { this.tests.push(v => /\S+@\S+\.\S+/.test(v) ? null : 'must be a valid email'); return this; }
  min(n) { this.tests.push(v => (v && v.length >= n) ? null : `length must be at least ${n}`); return this; }
  valid(...vals) { this.tests.push(v => vals.includes(v) ? null : `must be one of ${vals.join(',')}`); return this; }
  validate(val) {
    if (val === undefined || val === null || val === '') {
      if (this.req) return 'is required';
      return null;
    }
    if (typeof val !== 'string') return 'must be a string';
    for (const test of this.tests) {
      const err = test(val);
      if (err) return err;
    }
    return null;
  }
}

function string() { return new JoiString(); }

function object(shape) {
  return {
    validate(data = {}) {
      const errors = {};
      const value = {};
      for (const key in shape) {
        const msg = shape[key].validate(data[key]);
        if (msg) errors[key] = msg;
        else if (data[key] !== undefined) value[key] = data[key];
      }
      return { value, error: Object.keys(errors).length ? { details: errors } : null };
    }
  };
}

module.exports = { string, object };
