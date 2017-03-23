const responseUtil = require('../../../shared/utils/response');
const networkService = require('../services/network');
const createServicePayload = require('../../../shared/utils/create-service-payload');

module.exports = async (req, reply) => {
  try {
    const { message } = createServicePayload(req);
    const payload = { id: req.auth.credentials.id };
    const data = await networkService.listNetworksForUser(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
