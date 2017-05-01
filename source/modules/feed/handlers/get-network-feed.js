const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const objectService = require('../../core/services/object');
const feedService = require('../services/feed');

module.exports = async (req, reply) => {
  try {
    const { message } = createServicePayload(req);

    const totalCountPromise = objectService.count({
      $or: [
        { parentType: 'organisation', parentId: message.network.organisationId },
        { parentType: 'network', parentId: req.params.networkId },
        { parentType: 'user', parentId: message.credentials.id },
      ],
    }, message);

    const feedPromise = feedService.makeForNetwork(R.merge(
      req.query, {
        networkId: req.params.networkId,
        organisationId: message.network.organisationId,
      }
    ), message);
    const [feedItems, count] = await Promise.all([feedPromise, totalCountPromise]);

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
