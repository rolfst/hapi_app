const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const organisationService = require('../../core/services/organisation');
const feedService = require('../services/feed');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    await organisationService.userHasRoleInOrganisation(
      payload.organisationId, message.credentials.id);

    const { feedItems, count, relatedUsers } = await feedService.makeForOrganisation(R.merge(
      req.query, {
        organisationId: payload.organisationId,
      }
    ), message);

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
