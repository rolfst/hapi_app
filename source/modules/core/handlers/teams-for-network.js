const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const networkService = require('../services/network');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const data = await networkService.listTeamsForNetwork(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
