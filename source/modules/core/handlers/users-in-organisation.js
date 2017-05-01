const responseUtil = require('../../../shared/utils/response');
const organisationService = require('../services/organisation');
const createServicePayload = require('../../../shared/utils/create-service-payload');

module.exports = async (req, reply) => {
  try {
    const { message, payload } = createServicePayload(req);
    const [data, counts] = await Promise.all([
      organisationService.listUsers(payload, message),
      organisationService.countUsers(payload, message),
    ]);

    return reply({
      data: responseUtil.toSnakeCase(data),
      meta: {
        pagination: {
          limit: req.query.limit,
          offset: req.query.offset,
          total_count: counts.total,
        },
        counts,
      },
    });
  } catch (err) {
    return reply(err);
  }
};
