const createServicePayload = require('../../../shared/utils/create-service-payload');
const service = require('../services/flexchange');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const response = await service.createExchange(payload, message);

    return reply({ success: true, data: response.toJSON() });
  } catch (err) {
    return reply(err);
  }
};
