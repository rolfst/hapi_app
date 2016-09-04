import bunyan from 'bunyan';
import { omit } from 'lodash';

const createMetaData = (event) => ({
  msec: event.data.msec || null,
  tags: event.tags,
  stack: event.data ? event.data.data.stack : null,
});

export default (() => {
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
    },
    getLogger() {
      return bunyan.createLogger({
        name: 'node-api',
        streams: [{
          level: 'info',
          stream: process.stdout,
        }],
        ..._defaultMeta,
      });
    },
    debug(message, metaData) {
      this.getLogger().debug(metaData, message);
    },
    info(message, metaData) {
      this.getLogger().info(metaData, message);
    },
    warning(message, metaData) {
      this.getLogger().warn(metaData, message);
    },
    error(message, metaData) {
      this.getLogger().error({ ...metaData, _defaultMeta }, message);
    },
    internalError(event) {
      this.getLogger().error({ ...createMetaData(event), _defaultMeta }, 'Internal error');
    },
  };
})();
