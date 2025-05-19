import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

const logDir = path.join(__dirname, '../backend/logs');

const logger = require('../backend/utils/logger');

describe('logger utility', () => {
  it('creates logs directory', () => {
    expect(fs.existsSync(logDir)).toBe(true);
  });

  it('requestLogger logs based on status code', () => {
    const req = { method:'GET', url:'/x', headers:{} };
    const res = { statusCode:200, on(event, cb){ if(event==='finish') this._cb=cb; }, end(){ this._cb(); }};
    const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
    logger.requestLogger(req, res, () => {});
    res.on('finish', ()=>{}); // Should not call debug until finish
    res._cb();
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
