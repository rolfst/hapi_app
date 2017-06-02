const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');
const feedService = require('../services/feed');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    payload.include = req.query.include ? req.query.include.split(',') : [];
    const feedItem = await messageService.getAsObject(payload, message);

    return reply({
      data: responseUtil.toSnakeCase(feedItem),
      meta: {
        related: {
          users: await feedService.findRelatedUsersForObject(feedItem),
        },
      },
    });
  } catch (err) {
    return reply(err);
  }
};
