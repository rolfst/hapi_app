const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const objectService = require('../../core/services/object');
const feedService = require('../services/feed');

module.exports = async (req, reply) => {
  try {
    const { message } = createServicePayload(req);
    const [feedItems, count] = await Promise.all([
      feedService.makeForTeam(R.merge(req.query, { teamId: req.params.teamId }), message),
      objectService.count({ parentType: 'team', parentId: req.params.teamId }, message),
    ]);

    return reply({
      data: responseUtil.toSnakeCase(feedItems),
      meta: {
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total_count: count,
        },
      },
    });
  } catch (err) {
    return reply(err);
  }
};
