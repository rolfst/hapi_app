import Url from 'url';
import Qs from 'qs';
import authorizationPlugin from 'hapi-acl-plugin';
import * as networkUtil from 'shared/utils/network';
import createError from 'shared/utils/create-error';
import createActions from 'shared/utils/create-actions';

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

export const onPreResponse = (req, reply) => {
  if (req.response instanceof Error && req.response.isBoom) {
    let error = req.response;

    if (req.response.data.isJoi) {
      error = createError('422', req.response.data.details[0].message);
    }

    const errorResponse = transformBoomToErrorResponse(error);

    return reply(errorResponse).code(errorResponse.status_code);
  }

  return reply.continue();
};

export const registerAuthorizationPlugin = () => ({
  register: authorizationPlugin, options: {
    actions: createActions(),
    role: (user, params) => {
      if (params.networkId) {
        const network = networkUtil.select(user.Networks, params.networkId);

        return network.NetworkUser.roleType;
      }
    },
  },
});

export const makeConfig = () => {
  const options = {};

  return options;
};
