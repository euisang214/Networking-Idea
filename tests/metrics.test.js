const { describe, it, expect } = require('./test-helpers');
const metrics = require('../backend/utils/metrics');

describe('metrics util', () => {
  it('increments counters and exposes metrics endpoint', () => {
    metrics.inc('requests_total');
    metrics.inc('requests_total', 2);
    metrics.inc('errors_total');

    const app = { get(path, handler) { this.path = path; this.handler = handler; } };
    metrics.init(app);
    let sent;
    const res = { type: () => res, send: (v) => { sent = v; } };
    app.handler({}, res);
    const lines = sent.split('\n').sort();
    expect(lines).toEqual(['errors_total 1', 'requests_total 3']);
  });
});
