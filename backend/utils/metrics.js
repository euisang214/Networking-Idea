const metrics = {};

function inc(name, value = 1) {
  metrics[name] = (metrics[name] || 0) + value;
}

function collect() {
  return Object.entries(metrics)
    .map(([k, v]) => `${k} ${v}`)
    .join('\n');
}

function init(app) {
  app.get('/metrics', (req, res) => {
    res.type('text/plain').send(collect());
  });
}

module.exports = { inc, init };
