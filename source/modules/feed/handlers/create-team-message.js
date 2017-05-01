const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const messageService = require('../services/message');
const teamService = require('../../core/services/team');
const responseUtil = require('../../../shared/utils/response');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    const network = await teamService.findById(req.params.teamId);

    payload.parentType = 'team';
    payload.parentId = req.params.teamId;

    const feedItems = await messageService.create(payload, R.merge(message, { network }));

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
