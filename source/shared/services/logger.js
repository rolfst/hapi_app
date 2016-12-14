import { isUndefined, omit } from 'lodash';
import bunyan from 'bunyan';

const environment = process.env.API_ENV;
const defaultConfig = process.env.CI ?
   require('../configs/logs-ci').default :
   require(`../configs/logs-${environment}`).default;

const fetchContextObjects = (args = {}) => {
  if (isUndefined(args.err)) return { context: args };

  const context = { err: args.err.stack, context: omit(args, 'err') };
  if (args.err.output) context.statusCode = args.err.output.statusCode;
  if (args.err.data) context.errorCode = args.err.data.errorCode;

  return context;
};

const buildLogContext = (data = {}) => {
  const options = data.message || {};
  const logArgs = omit(data, 'message');

  if (options.artifacts) {
    const requestIdObject = { requestId: options.artifacts.requestId };

    return { ...requestIdObject, ...fetchContextObjects(logArgs) };
  }

  return { ...fetchContextObjects(logArgs) };
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
