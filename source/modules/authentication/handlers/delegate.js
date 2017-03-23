const createServicePayload = require('../../../shared/utils/create-service-payload');
const authenticationService = require('../services/authentication');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    message.deviceName = req.headers['user-agent'];

    const result = await authenticationService.delegate(payload, message);

    return reply({ success: true, data: { access_token: result.accessToken } });
  } catch (err) {
    return reply(err);
  }
};
