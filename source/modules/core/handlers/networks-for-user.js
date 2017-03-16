const responseUtil = require('../../../shared/utils/response');
const networkService = require('../services/network');
const createServicePayload = require('../../../shared/utils/create-service-payload');

module.exports = async (req, reply) => {
  try {
    const { message, payload } = createServicePayload(req);
    const data = await networkService.listNetworksForUser(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
