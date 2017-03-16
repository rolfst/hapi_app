const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const pollService = require('../services/poll');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const poll = await pollService.vote(payload, message);

    return reply({ data: responseUtil.toSnakeCase(poll) });
  } catch (err) {
    return reply(err);
  }
};
