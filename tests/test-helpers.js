const { describe, it, beforeAll, afterAll, beforeEach, afterEach, expect, jest: Jest } = require('@jest/globals');
const { render, screen } = require('@testing-library/react');

const vi = {
  fn: Jest.fn,
  spyOn: (obj, method) => {
    const spy = Jest.spyOn(obj, method);
    spy.mockImplementation(() => undefined);
    return spy;
  },
  mock: (moduleName, factory) => Jest.mock(moduleName, factory, { virtual: true }),
  clearAllMocks: Jest.clearAllMocks
};

// Provide aliases for compatibility with existing tests
const before = beforeAll;
const after = afterAll;

module.exports = {
  describe,
  it,
  expect,
  vi,
  render,
  screen,
  before,
  after,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach
};
