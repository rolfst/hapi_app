const R = require('ramda');
const stream = require('stream');
const bunyan = require('bunyan');
const argv = require('yargs').argv;
const Raven = require('./sentry')();

const safeCycles = bunyan.safeCycles;

/**
 * @module shared/services/logger
 */

const LogLevel = {
  NONE: null,
  FATAL: 'fatal',
  ERROR: 'error',
  WARNING: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

// This object stores the actual enum
const ELogLevel = Object.keys(LogLevel);

// This object gives a quick binding from the log level to the severity (index in the enum)
const LogLevelSeverities = (() => {
  const severities = {};

  ELogLevel.forEach((logLevel, index) => {
    severities[logLevel] = index;
  });

  return severities;
})();

const logConfig = require('../configs/logger');

const logEnvironment = (() => {
  if (process.env.CI) return 'ci';

  if (process.env.API_ENV in logConfig.defaultLogLevels) {
    return process.env.API_ENV;
  }

  return logConfig.defaultEnvironment;
})();

// Loglevel at which we actually display errors (regardless of errorLogLevel)
const currentLogLevel = ELogLevel.indexOf((() => {
  // Commandline argument to suppress all warnings & errors
  if (argv.silent) {
    return 'NONE';
  }

  // Commandline argument to receive all log levels
  if (argv.verbose || argv.debug) {
    return 'DEBUG';
  }

  // Commandline argument to receive all log levels except debug
  if (argv.info) {
    return 'INFO';
  }

  if (process.env.LOGLEVEL && process.env.LOGLEVEL in LogLevel) {
    return process.env.LOGLEVEL;
  }

  return (logEnvironment in logConfig.defaultLogLevels
    ? logConfig.defaultLogLevels[logEnvironment]
    : 'WARNING');
})());

// Minimum loglevel that is sent to stderr, the rest goes to stdout
const errorLogLevel = ELogLevel.indexOf(LogLevel[logConfig.errorLogLevel]);

// Minimum loglevel that is exported to an external service like datadog or sentry (or both)
const exportLogLevel = ELogLevel.indexOf(LogLevel[logConfig.errorLogLevel]);

const bunyanConfig = {
  streams: [],
};

// Dirty hack for bunyan so it doesn't upstream different error levels
//  - The missing space between function name and first parenthese is thanks to the linter
class BunyanStreamWrapper {
  static createBunyanConfigEntry(bunyanLogLevel, realStream) {
    return {
      type: 'raw',
      level: bunyanLogLevel,
      stream: new BunyanStreamWrapper(bunyanLogLevel, realStream),
    };
  }

  constructor(bunyanLogLevel, realStream) {
    this.processLevel = bunyan.levelFromName[bunyanLogLevel];
    this.stream = realStream;
  }

  write(rec) {
    if (rec.level !== this.processLevel) {
      return;
    }

    const str = JSON.stringify(rec, safeCycles());
    this.stream.write(`${str}\n`);
  }
}

// Build bunyan config based on the current loglevel
ELogLevel.forEach((logLevel, severity) => {
  if (!LogLevel[logLevel] || currentLogLevel < severity) {
    return;
  }

  const streamOutput = severity > errorLogLevel ? process.stdout : process.stderr;

  bunyanConfig.streams.push(BunyanStreamWrapper.createBunyanConfigEntry(
    LogLevel[logLevel],
    streamOutput
  ));
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

// This function will send the log to datadog and/or sentry if the severity is high enough
//  - The flattenedData argument is to prevent flattening the same data twice
const exportLog = async (severity, message, data, flattenedData = null) => {
  // If we're not running in production, bail out since we don't want to pollute our data
  if (process.env.API_ENV !== 'production' && !process.env.FORCE_SENTRY_LOG) {
    return;
  }

  // Lower severity actually means the error is more important
  if (severity > exportLogLevel) {
    return;
  }

/*  Raven.context(() => {
    // Should we add user context?
    if (data.user) {
      Raven.setContext({
        user: data.user
      });
    }
*/
    // Send entry to sentry
    //  - Concerning log level, sentry uses the same naming convention we do but in lowercase
  if (data instanceof Error) {
    Raven.captureException(data, {
      level: ELogLevel[severity].toLowerCase(),
      extra: { message },
    });
  } else {
    // Make sure we have flattened data
    Raven.captureMessage(flattenedData || buildLogContext(data), {
      level: ELogLevel[severity].toLowerCase(),
      extra: { message },
    });
  }
//  });

  // Send errors and stuff to sentry and datadog
  return true;
};

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
      const flattenedData = buildLogContext(data);

      logger.debug(flattenedData, message);

      exportLog(LogLevelSeverities.DEBUG, message, data, flattenedData);
    },
    /**
     * @param {string} message - message
     * @param {object} [data] - objects to log
     * @param {object} [data.artifacts] - dataobject that contains context
     * @param {string} [data.artifacts.requestId] - representing trace identifier
     * @method info - logs at a info level
     */
    info(message, data) {
      const flattenedData = buildLogContext(data);

      logger.info(flattenedData, message);

      exportLog(LogLevelSeverities.INFO, message, data, flattenedData);
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
      const flattenedData = buildLogContext(data);

      logger.warn(flattenedData, message);

      exportLog(LogLevelSeverities.WARNING, message, data, flattenedData);
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
      const flattenedData = buildLogContext(data);

      logger.error(flattenedData, message);

      exportLog(LogLevelSeverities.ERROR, message, data, flattenedData);
    },
    /**
     * @param {string} message - message
     * @param {error} [error] - error object to log
     * @method fatal - logs at a fatal level
     */
    fatal(message, error) {
      logger.fatal(error, message);

      exportLog(LogLevelSeverities.FATAL, message, error);
    },
  };
};

module.exports = createLogger;
module.exports.LogLevel = LogLevel;
module.exports.ELogLevel = ELogLevel;

// Backwards compatibility - these should be removed sometime (still used in a test or 2)
module.exports.createLogger = createLogger;
