const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const feedService = require('../services/feed');
const organisationService = require('../../core/services/organisation');
const createError = require('../../../shared/utils/create-error');

module.exports = async (req, reply) => {
  try {
    const { message, payload } = createServicePayload(req);

    if (
      !(await organisationService.userHasRoleInOrganisation(
        payload.organisationId,
        message.credentials.id))
    ) {
      throw createError('403');
    }

    const { feedItems, count } = await feedService.makeForPerson(payload, message);

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
