const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    payload.parentType = 'network';
    payload.parentId = req.params.networkId;

    const feedItems = await messageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
