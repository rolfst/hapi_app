const createServicePayload = require('../../../../shared/utils/create-service-payload');
const responseUtil = require('../../../../shared/utils/response');
const privateMessageService = require('../services/private-message');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const result = await privateMessageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    return reply(err);
  }
};
