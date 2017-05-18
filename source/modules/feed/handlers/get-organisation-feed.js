const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const objectService = require('../../core/services/object');
const organisationService = require('../../core/services/organisation');
const { EObjectTypes } = require('../../core/definitions');
const feedService = require('../services/feed');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    await organisationService.userHasRoleInOrganisation(
      payload.organisationId, message.credentials.id);

    const totalCountPromise = objectService.count({
      constraint: {
        $and: {
          parentType: EObjectTypes.ORGANISATION,
          parentId: payload.organisationId,
          organisationId: payload.organisationId,
        },
      },
    }, message);

    const feedPromise = feedService.makeForOrganisation(R.merge(
      req.query, {
        organisationId: payload.organisationId,
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
