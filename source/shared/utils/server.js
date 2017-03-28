const Url = require('url');
const Qs = require('qs');
const R = require('ramda');
const createError = require('./create-error');

const logger = require('../services/logger')('NODE-API/server/response');

const onRequest = () => (req, reply) => {
  const uri = req.raw.req.url;
  const parsed = Url.parse(uri, false);
  parsed.query = Qs.parse(parsed.query);
  req.setUrl(parsed);

  process.env.BASE_URL = `${req.connection.info.protocol}://${req.info.host}`;

  return reply.continue();
};

const transformBoomToErrorResponse = (boom) => ({
  type: boom.data.errorType,
  detail: boom.output.payload.message,
  error_code: boom.data.errorCode || boom.output.payload.statusCode.toString(),
  status_code: boom.output.payload.statusCode,
});

const logApplicationError = (message, payload, error) => {
  logger.error('Error from application', {
    message,
    payload,
    err: { message: error.message, stack: error.stack },
  });
};

const onPreResponse = () => (req, reply) => {
  const message = R.merge(req.auth, req.credentials);
  const errorPayload = R.merge(R.pick(['info', 'headers', 'payload', 'params', 'query'], req),
    {
      method: req.method,
      url: req.path,
    });

  if (req.response instanceof Error && req.response.isBoom) {
    let error = req.response;

    if (req.response.data && req.response.data.isJoi) {
      error = createError('422', req.response.data.details[0].message);
    } else if (req.response.data === null) {
      // Data attribute will be null when Hapi throws an internal error
      error = createError(req.response.output.statusCode.toString());
    }

    if (req.response.output.statusCode !== 404) {
      logApplicationError(message, errorPayload, req.response);
    }

    const errorResponse = transformBoomToErrorResponse(error);

    return reply(errorResponse).code(errorResponse.status_code);
  }

  if (req.response instanceof Error) {
    logApplicationError(message, errorPayload, req.response);

    return reply(transformBoomToErrorResponse(createError('500'))).code('500');
  }

  return reply.continue();
};

const makeConfig = () => {
  const options = {};

  return options;
};

exports.makeConfig = makeConfig;
exports.onPreResponse = onPreResponse;
exports.onRequest = onRequest;
exports.transformBoomToErrorResponse = transformBoomToErrorResponse;
