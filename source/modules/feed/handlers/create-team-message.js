const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const messageService = require('../services/message');
const teamService = require('../../core/services/team');
const networkService = require('../../core/services/network');
const responseUtil = require('../../../shared/utils/response');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    const team = await teamService.get({ teamId: req.params.teamId }, message);
    const network = await networkService.get({ networkId: team.networkId }, message);

    payload.parentType = 'team';
    payload.parentId = req.params.teamId;

    const feedItems = await messageService.create(payload, R.merge(message, { network }));

    return reply({ data: responseUtil.toSnakeCase(feedItems) });
  } catch (err) {
    return reply(err);
  }
};
