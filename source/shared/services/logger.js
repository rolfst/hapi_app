import R from 'ramda';
import stream from 'stream';
import bunyan from 'bunyan';

/**
 * @module shared/services/logger
 */

const environment = process.env.API_ENV;
const defaultConfig = process.env.CI ?
   require('../configs/logs-ci').default :
   require(`../configs/logs-${environment}`).default;

const makeMessage = R.pipe(
  R.pick(['credentials', 'artifacts', 'network']),
  R.reject(R.isNil)
);

const buildLogContext = (args = {}) => {
  let payloadWithoutStreams = {};

  if (args.payload) {
    payloadWithoutStreams = Object.keys(args.payload).reduce((obj, key) => {
      return (args.payload[key] instanceof stream.Readable) ?
        { ...obj, [key]: 'Readable Stream' } :
        { ...obj, [key]: args.payload[key] };
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

export const getLogger = (name) => bunyan.createLogger({ name, ...defaultConfig });

/**
 * @param {string|Logger} loggerOrName
 * @method createLogger
 * @return {void}
 */
export const createLogger = (loggerOrName) => {
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

export default createLogger;
