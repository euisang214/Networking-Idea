const responseFormatter = require('../backend/utils/responseFormatter');
const { describe, it, expect } = require('./test-helpers');

function createMockRes() {
  return {
    statusCode: null,
    jsonPayload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.jsonPayload = payload; return this; },
    endCalled: false,
    end() { this.endCalled = true; }
  };
}

describe('responseFormatter', () => {
  it('success should return formatted success object', () => {
    const res = createMockRes();
    responseFormatter.success(res, { a: 1 }, 'ok', 201);
    expect(res.statusCode).toBe(201);
    expect(res.jsonPayload).toEqual({ success: true, message: 'ok', data: { a: 1 } });
  });

  it('error should return formatted error object', () => {
    const res = createMockRes();
    responseFormatter.error(res, 'bad', 400, {f:'e'});
    expect(res.statusCode).toBe(400);
    expect(res.jsonPayload).toEqual({ success: false, message: 'bad', errors: {f:'e'} });
  });

  it('validationError should call error with 400', () => {
    const res = createMockRes();
    responseFormatter.validationError(res, {f:'e'});
    expect(res.statusCode).toBe(400);
  });

  it('paginated should include pagination info', () => {
    const res = createMockRes();
    responseFormatter.paginated(res, [1,2], 2, 5, 12);
    expect(res.statusCode).toBe(200);
    expect(res.jsonPayload.pagination).toEqual({
      page:2, limit:5, total:12, totalPages:3,
      hasNextPage:true, hasPrevPage:true
    });
  });

  it('created should use success with 201', () => {
    const res = createMockRes();
    responseFormatter.created(res, {id:1});
    expect(res.statusCode).toBe(201);
  });

  it('noContent should send 204 with no body', () => {
    const res = createMockRes();
    responseFormatter.noContent(res);
    expect(res.statusCode).toBe(204);
    expect(res.endCalled).toBe(true);
  });
});
