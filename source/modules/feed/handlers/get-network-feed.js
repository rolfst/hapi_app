const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const objectService = require('../../core/services/object');
const { EObjectTypes } = require('../../core/definitions');
const feedService = require('../services/feed');

module.exports = async (req, reply) => {
  try {
    const { message } = createServicePayload(req);

    const totalCountPromise = objectService.count({
      constraint: {
        $or: [
          { parentType: EObjectTypes.ORGANISATION, parentId: message.network.organisationId },
          { parentType: EObjectTypes.NETWORK, parentId: req.params.networkId },
          { parentType: EObjectTypes.USER, parentId: message.credentials.id },
        ],
      },
    }, message);

    const feedPromise = feedService.makeForNetwork(R.merge(
      req.query, {
        networkId: req.params.networkId,
        organisationId: message.network.organisationId,
      }
    ), message);
    const [{ feedItems, relatedUsers }, count] =
      await Promise.all([feedPromise, totalCountPromise]);

    return reply({
      data: responseUtil.toSnakeCase(feedItems),
      meta: {
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total_count: count,
        },
        related: {
          users: relatedUsers,
        },
      },
    });
  } catch (err) {
    return reply(err);
  }
};
