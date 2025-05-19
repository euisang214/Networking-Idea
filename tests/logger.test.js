const { describe, it, expect, vi, beforeEach } = require('./test-helpers');
const fs = require('fs');
const path = require('path');

vi.mock('winston', () => ({
  format: { combine: () => ({}), printf: () => {}, timestamp: () => {}, errors: () => {}, splat: () => {}, colorize: () => {} },
  transports: { Console: class {}, File: class {} },
  createLogger: () => ({ debug: vi.fn(), warn: vi.fn(), error: vi.fn() })
}));

const logDir = path.join(__dirname, '../backend/logs');

const logger = require('../backend/utils/logger');

describe('logger utility', () => {
  it('creates logs directory', () => {
    expect(fs.existsSync(logDir)).toBe(true);
  });

  it('requestLogger logs based on status code', () => {
    const req = { method:'GET', url:'/x', headers:{} };
    const res = { statusCode:200, _cbs:[], on(event, cb){ if(event==='finish') this._cbs.push(cb); }, end(){ this._cbs.forEach(fn=>fn()); }};
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
    logger.requestLogger(req, res, () => {});
    res.on('finish', ()=>{}); // Should not call debug until finish
    res.end();
    expect(debugSpy).toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('errorLogger logs error info', () => {
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
    const err = new Error('oops');
    const req = { method:'POST', url:'/x', body:{} };
    logger.errorLogger(err, req, {}, () => {});
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
