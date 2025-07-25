const winston = require('winston');
const TransportStream = require('winston-transport');
const path = require('path');
const fs = require('fs');
const { inc } = require('./metrics');
const config = require('../config');

class LokiTransport extends TransportStream {
  constructor(opts = {}) {
    super(opts);
    this.endpoint = opts.endpoint;
  }
  log(info, callback) {
    if (typeof this.emit === 'function') {
      setImmediate(() => this.emit('logged', info));
    }
    if (!this.endpoint) return callback();
    try {
      const url = new URL(this.endpoint);
      const payload = JSON.stringify({
        streams: [
          {
            stream: { level: info.level, service: 'mentor-connect' },
            values: [[`${Date.now()}000000`, info.message]]
          }
        ]
      });
      const httpLib = url.protocol === 'https:' ? require('https') : require('http');
      const req = httpLib.request(
        {
          method: 'POST',
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          headers: { 'Content-Type': 'application/json' }
        },
        () => {}
      );
      req.on('error', () => {});
      req.write(payload);
      req.end();
    } catch (e) {}
    callback();
  }
}

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

// Create the logger
const logger = winston.createLogger({
  level: config.app.env === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  defaultMeta: { service: 'mentor-connect' },
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // Write to all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    ...(config.logging.lokiUrl ? [new LokiTransport({ endpoint: config.logging.lokiUrl })] : [])
  ],
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add request logger middleware
logger.requestLogger = (req, res, next) => {
  const startHrTime = process.hrtime();
  
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1000000;

    const log = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: `${elapsedTimeInMs.toFixed(3)}ms`,
      userAgent: req.headers['user-agent'],
      userId: req.user ? req.user.id : undefined
    };

    inc(`http_requests_total{method="${req.method}",status="${res.statusCode}"}`);
    
    if (res.statusCode >= 400) {
      logger.warn(`HTTP ${log.method} ${log.url}`, log);
    } else {
      logger.debug(`HTTP ${log.method} ${log.url}`, log);
    }
  });
  
  next();
};

// Add error logger middleware
logger.errorLogger = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, {
    error: err,
    method: req.method,
    url: req.originalUrl || req.url,
    body: req.body,
    userId: req.user ? req.user.id : undefined
  });
  inc('errors_total');

  next(err);
};

module.exports = logger;
