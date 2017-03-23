const createServicePayload = require('../../../shared/utils/create-service-payload');
const authenticationService = require('../services/authentication');

/*
 * The authentication script first authenticates with the Flex-Appeal database
 * before going further. When the user is authenticated with the Flex-Appeal database
 * we try to authenticate the user with each integration of the network the user
 * belongs to. When the user is authenticated with an integration, we will
 * set the user_tokens retrieved from the integration.
 */
module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    message.deviceName = req.headers['user-agent'];

    const result = await authenticationService.authenticate(payload, message);
    const data = {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      last_login: result.user.lastLogin,
    };

    return reply({ data });
  } catch (err) {
    return reply(err);
  }
};
