const { describe, it, expect, vi } = require('./test-helpers');
const rolesAllowed = require('../backend/middlewares/rolesAllowed');
const { AuthorizationError } = require('../backend/utils/errorTypes');

describe('rolesAllowed middleware', () => {
  it('calls next when role allowed', () => {
    const req = { user: { userType: 'admin' } };
    const next = vi.fn();
    rolesAllowed(['admin'])(req, {}, next);
    expect(next).toHaveBeenCalled();
  });

  it('passes AuthorizationError to next when role not allowed', () => {
    const req = { user: { userType: 'candidate' } };
    const next = vi.fn();
    rolesAllowed(['admin'])(req, {}, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(AuthorizationError);
  });
});
