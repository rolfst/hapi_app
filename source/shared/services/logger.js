const R = require('ramda');
const stream = require('stream');
const bunyan = require('bunyan');

/**
 * @module shared/services/logger
 */

const LogLevel = {
  NONE: null,
  FATAL: 'fatal',
  ERROR: 'error',
  WARNING: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

const ELogLevel = Object.keys(LogLevel);

const logConfig = require('../configs/logger');

const logEnvironment = (() => {
  if (process.env.CI) return 'ci';

  if (process.env.API_ENV in logConfig.defaultLogLevels) {
    return process.env.API_ENV;
  }

  return logConfig.defaultEnvironment;
})();

// Loglevel at which we actually display errors (regardless of errorLogLevel)
const currentLogLevel = ELogLevel.indexOf(
  logEnvironment in logConfig.defaultLogLevels
  ? logConfig.defaultLogLevels[logEnvironment]
  : LogLevel.WARNING
);

// Minimum loglevel that is sent to stderr, the rest goes to stdout
const errorLogLevel = ELogLevel.indexOf(LogLevel[logConfig.errorLogLevel]);

const bunyanConfig = {
  streams: []
};

// Build bunyan config based on the current loglevel
ELogLevel.forEach((logLevel, severity) => {
  if (!LogLevel[logLevel] || currentLogLevel < severity) {
    return;
  }

  bunyanConfig.streams.push({
    level: logLevel,
    stream: severity > errorLogLevel ? process.stdout : process.stderr
  });
});

const makeMessage = R.pipe(
  R.pick(['credentials', 'artifacts', 'network']),
  R.reject(R.isNil)
);

const buildLogContext = (args = {}) => {
  let payloadWithoutStreams = {};

  if (args.payload) {
    payloadWithoutStreams = Object.keys(args.payload).reduce((obj, key) => {
      return (args.payload[key] instanceof stream.Readable) ?
        R.merge(obj, { [key]: 'Readable Stream' }) :
        R.merge(obj, { [key]: args.payload[key] });
    }, {});
  }

  const payload = R.merge(R.omit(['err', 'message', 'payload'], args), payloadWithoutStreams);

  if (args.err && args.err.output) payload.statusCode = args.err.output.statusCode;
  if (args.err && args.err.data) payload.errorCode = args.err.data.errorCode;

  return {
    err: args.err ? args.err.stack : null,
    message: args.message ? makeMessage(args.message) : {},
    context: payload,
  };
};

const getLogger = (name) => bunyan.createLogger(R.merge({ name }, bunyanConfig));

/**
 * @param {string|Logger} loggerOrName
 * @method createLogger
 * @return {void}
 */
const createLogger = (loggerOrName) => {
  const logger = typeof loggerOrName === 'string' ?
    getLogger(loggerOrName) : loggerOrName;

  return {
    /**
     * @param {string} message - message
     * @param {object} [data] - objects to log
     * @param {object} [data.artifacts] - dataobject that contains context
     * @param {string} [data.artifacts.requestId] - representing trace identifier
     * @method debug - logs at a debug level
     */
    debug(message, data) {
      logger.debug(buildLogContext(data), message);
    },
    /**
     * @param {string} message - message
     * @param {object} [data] - objects to log
     * @param {object} [data.artifacts] - dataobject that contains context
     * @param {string} [data.artifacts.requestId] - representing trace identifier
     * @method info - logs at a info level
     */
    info(message, data) {
      logger.info(buildLogContext(data), message);
    },
    /**
     * @param {string} message - message
     * @param {object} [data] - objects to log
     * @param {error} [data.err] - error object to log
     * @param {object} [data.artifacts] - dataobject that contains context
     * @param {string} [data.artifacts.requestId] - representing trace identifier
     * @method warn - logs at a warning level
     */
    warn(message, data) {
      logger.warn(buildLogContext(data), message);
    },
    /**
     * @param {string} message - message
     * @param {object} [data] - objects to log
     * @param {error} [data.err] - error object to log
     * @param {object} [data.artifacts] - dataobject that contains context
     * @param {string} [data.artifacts.requestId] - representing trace identifier
     * @method error - logs at a error level
     */
    error(message, data) {
      logger.error(buildLogContext(data), message);
    },
    /**
     * @param {string} message - message
     * @param {error} [error] - error object to log
     * @method fatal - logs at a fatal level
     */
    fatal(message, error) {
      logger.fatal(error, message);
    },
  };
};

module.exports = createLogger;
module.exports.LogLevel = LogLevel;
module.exports.ELogLevel = ELogLevel;

// Backwards compatibility - these should be removed sometime (still used in a test or 2)
module.exports.createLogger = createLogger;
