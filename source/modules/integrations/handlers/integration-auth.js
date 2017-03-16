const createServicePayload = require('../../../shared/utils/create-service-payload');
const integrationService = require('../services/integration');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    message.deviceName = req.headers['user-agent'];
    const accessToken = await integrationService.authenticate(payload, message);

    return reply({ data: { access_token: accessToken } });
  } catch (err) {
    return reply(err);
  }
};
