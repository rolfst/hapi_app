import Boom from 'boom';
import Url from 'url';
import Qs from 'qs';
import authorizationPlugin from 'hapi-acl-plugin';
import selectNetwork from 'common/utils/select-network';
import createError from 'common/utils/create-error';
import createActions from 'common/utils/create-actions';
import respondWithError from 'common/utils/respond-with-error';

export const onRequest = (req, reply) => {
  if (process.env.NODE_ENV !== 'testing') {
    console.log('Received request with path', req.path);
  }

  const uri = req.raw.req.url;
  const parsed = Url.parse(uri, false);
  parsed.query = Qs.parse(parsed.query);
  req.setUrl(parsed);

  process.env.BASE_URL = `${req.connection.info.protocol}://${req.info.host}`;

  return reply.continue();
};

export const onPreResponse = (req, reply) => {
  if (req.response.data && (req.response.data.isJoi || req.response.data.isBoom)) {
    let error;

    if (req.response.isBoom) {
      error = req.response;
    }

    if (req.response.data.isJoi) {
      const errorMessage = req.response.data.details[0].message;
      error = createError(Boom.badData(errorMessage), 'ValidationError');
    }

    return reply(respondWithError(error)).code(error.output.statusCode);
  }

  return reply.continue();
};

export const registerAuthorizationPlugin = () => ({
  register: authorizationPlugin, options: {
    actions: createActions(),
    role: (user, params) => {
      if (params.networkId) {
        const network = selectNetwork(user.Networks, params.networkId);

        return network.NetworkUser.roleType;
      }
    },
  },
});

export const makeConfig = () => {
  const options = {};

  if (process.env.NODE_ENV === 'debug') {
    options.debug = {
      request: ['error'],
    };
  }

  return options;
};
