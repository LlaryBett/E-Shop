const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '..', 'logs');
    this.ensureLogsDirectory();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level,
      message,
      ...meta
    });
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logsDir, filename);
    fs.appendFileSync(filePath, content + '\n');
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Write to console
    console.log(formattedMessage);
    
    // Write to file
    this.writeToFile('app.log', formattedMessage);
    
    // Write to level-specific file
    if (level === 'error') {
      this.writeToFile('error.log', formattedMessage);
    }
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }

  // HTTP request logger middleware
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const meta = {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        };

        const level = res.statusCode >= 400 ? 'warn' : 'info';
        this.log(level, `${req.method} ${req.originalUrl} ${res.statusCode}`, meta);
      });

      next();
    };
  }

  // Error logger middleware
  errorLogger() {
    return (err, req, res, next) => {
      const meta = {
        method: req.method,
        url: req.originalUrl,
        stack: err.stack,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      this.error(err.message, meta);
      next(err);
    };
  }
}

module.exports = new Logger();
