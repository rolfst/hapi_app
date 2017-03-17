const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtils = require('../../../shared/utils/response');
const flexchangeService = require('../services/flexchange');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const result = await flexchangeService.listExchangesForUser(payload, message);

    return reply({ data: responseUtils.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
