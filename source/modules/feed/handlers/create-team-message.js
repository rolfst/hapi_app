const createServicePayload = require('../../../shared/utils/create-service-payload');
const messageService = require('../services/message');
const responseUtil = require('../../../shared/utils/response');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    payload.parentType = 'team';
    payload.parentId = req.params.teamId;

    const feedItems = await messageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
