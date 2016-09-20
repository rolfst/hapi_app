import Url from 'url';
import Qs from 'qs';
import { omit } from 'lodash';
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

export const onPreResponse = (req, reply) => {
  if ((req.response.source && req.response.source.is_error) || req.response.isBoom) {
    let error = req.response.source;

    if (req.response.isBoom) {
      error = createError(req.response.output.statusCode, req.response.output.payload.message);
    }

    if (req.response.data && req.response.data.isJoi) {
      const errorMessage = req.response.data.details[0].message;
      error = createError('422', errorMessage);
    }

    return reply(omit(error, 'is_error')).code(error.status_code);
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
