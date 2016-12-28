import Url from 'url';
import Qs from 'qs';
import { pick } from 'lodash';
import createError from './create-error';
import * as Logger from '../services/logger';

const logger = Logger.createLogger('NODE-API/server/response');

export const onRequest = (req, reply) => {
  const uri = req.raw.req.url;
  const parsed = Url.parse(uri, false);
  parsed.query = Qs.parse(parsed.query);
  req.setUrl(parsed);

  process.env.BASE_URL = `${req.connection.info.protocol}://${req.info.host}`;

  return reply.continue();
};

export const transformBoomToErrorResponse = (boom) => ({
  type: boom.data.errorType,
  detail: boom.output.payload.message,
  error_code: boom.data.errorCode || boom.output.payload.statusCode.toString(),
  status_code: boom.output.payload.statusCode,
});

export const onPreResponse = (ravenClient) => (req, reply) => {
  const message = { ...req.auth, ...req.credentials };
  const errorPayload = {
    ...pick(req, 'info', 'payload', 'params', 'query'),
    method: req.method,
    url: req.path,
  };

  if (req.response instanceof Error && req.response.isBoom) {
    let error = req.response;

    if (req.response.data && req.response.data.isJoi) {
      error = createError('422', req.response.data.details[0].message);
    } else if (req.response.data === null) {
      // Data attribute will be null when Hapi throws an internal error
      error = createError(req.response.output.statusCode.toString());
    }

    if (req.response.output.statusCode !== 404) {
      logger.warn('Error from application', { message, payload: errorPayload, err: req.response });
      ravenClient.mergeContext({ extra: { ...errorPayload } });
      ravenClient.captureException(req.response);
    }

    const errorResponse = transformBoomToErrorResponse(error);
    return reply(errorResponse).code(errorResponse.status_code);
  }

  if (req.response instanceof Error) {
    logger.error('Error from application', {
      message,
      payload: errorPayload,
      err: { message: req.response.message, stack: req.response.stack },
    });

    return reply(transformBoomToErrorResponse(createError('500'))).code('500');
  }

  return reply.continue();
};

export const makeConfig = () => {
  const options = {};

  return options;
};
