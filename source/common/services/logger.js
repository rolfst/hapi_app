import bunyan from 'bunyan';
import { omit } from 'lodash';

const createMetaData = (event) => ({
  msec: event.data.msec || null,
  tags: event.tags,
  stack: event.data ? event.data.data.stack : null,
});

export default (() => {
  let _logger;
  let _defaultMeta;

  return {
    init(request) {
      if (request) {
        _defaultMeta = {
          user: request.auth.credentials ? request.auth.credentials.toJSON() : null,
          artifacts: request.auth.artifacts || null,
          request: {
            id: request.id,
            payload: omit(request.payload, 'password'),
            user_agent: request.headers['user-agent'],
            method: request.method,
            url: request.path,
            headers: request.headers,
          },
        };
      }

      _logger = bunyan.createLogger({
        name: 'node-api',
        streams: process.env.NODE_ENV === 'testing' ? [] : [{
          level: 'info',
          stream: process.stdout,
        }],
      });
    },
    debug(message, metaData) {
      _logger.debug(metaData, message);
    },
    info(message, metaData) {
      _logger.info(metaData, message);
    },
    warning(message, metaData) {
      _logger.warn(metaData, message);
    },
    error(message, metaData) {
      _logger.error({ ...metaData, _defaultMeta }, message);
    },
    internalError(event) {
      _logger.error({ ...createMetaData(event), _defaultMeta }, 'Internal error');
    },
  };
})();
