const { describe, it, before, beforeEach } = require('node:test');
const assert = require('assert/strict');
const Module = require('module');
const { jest } = require('@jest/globals');
const { render, screen } = require('@testing-library/react');

const beforeAll = before;

function expect(received) {
  return {
    toBe: (expected) => assert.strictEqual(received, expected),
    toEqual: (expected) => assert.deepStrictEqual(received, expected),
    toBeNull: () => assert.strictEqual(received, null),
    toBeInstanceOf: (cls) => assert.ok(received instanceof cls),
    toThrow: (err) => assert.throws(received, err),
    toHaveBeenCalled: () => {
      assert.ok(received.mock && received.mock.calls.length > 0, 'Expected function to have been called');
    },
    toHaveBeenCalledWith: (...args) => {
      assert.ok(received.mock && received.mock.calls.some(call => {
        try { assert.deepStrictEqual(call, args); return true; }
        catch { return false; }
      }), 'Expected function to have been called with provided arguments');
    }
  };
}

const spies = new Set();
const mockModules = {};

function fn(impl = () => {}) {
  let implementation = impl;
  const spy = function(...args) {
    spy.mock.calls.push(args);
    return implementation.apply(this, args);
  };
  spy.mock = { calls: [] };
  spy.mockImplementation = (newImpl) => { implementation = newImpl; return spy; };
  spy.mockReturnValue = (val) => { implementation = () => val; return spy; };
  spy.mockRestore = () => { implementation = impl; spy.mock.calls = []; };
  spies.add(spy);
  return spy;
}

function spyOn(obj, method) {
  const original = obj[method];
  const spy = fn();
  const wrapper = function(...args) {
    const result = spy.apply(this, args);
    if (wrapper.impl) return wrapper.impl.apply(this, args);
    return result;
  };
  wrapper.mock = spy.mock;
  wrapper.mockImplementation = (impl) => { wrapper.impl = impl; return wrapper; };
  wrapper.mockRestore = () => { obj[method] = original; spies.delete(wrapper); };
  obj[method] = wrapper;
  spies.add(wrapper);
  return wrapper;
}

function mock(modulePath, factory) {
  let resolved;
  try {
    resolved = Module._resolveFilename(modulePath, module.parent);
  } catch {
    resolved = undefined;
  }
  const mod = factory();
  mockModules[modulePath] = mod;
  if (resolved && resolved !== modulePath) {
    mockModules[resolved] = mod;
  }
  return mod;
}

function clearAllMocks() {
  spies.forEach(spy => { spy.mock.calls = []; });
}

const vi = { fn, spyOn, mock, clearAllMocks };

// Intercept module loading to return mocks if provided
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  let resolved;
  try {
    resolved = Module._resolveFilename(request, parent);
  } catch {
    resolved = request;
  }
  if (Object.prototype.hasOwnProperty.call(mockModules, resolved)) {
    return mockModules[resolved];
  }
  if (Object.prototype.hasOwnProperty.call(mockModules, request)) {
    return mockModules[request];
  }
  return originalLoad(request, parent, isMain);
};

module.exports = {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  jest,
  render,
  screen
};
