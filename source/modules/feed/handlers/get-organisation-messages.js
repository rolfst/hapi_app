const createServicePayload = require('../../../shared/utils/create-service-payload');
const createError = require('../../../shared/utils/create-error');
const responseUtil = require('../../../shared/utils/response');
const messageService = require('../services/message');
const organisationService = require('../../core/services/organisation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    if (!await organisationService
      .userHasRoleInOrganisation(payload.organisationId, message.credentials.id)) {
      throw createError('10021');
    }

    const [messages, messageCount] = await Promise.all([
      messageService.listByOrganisation(payload, message),
      messageService.countByOrganisation(payload, message),
    ]);

    return reply({
      data: responseUtil.toSnakeCase(messages),
      meta: {
        pagination: {
          limit: payload.limit,
          offset: payload.offset || 0,
          total_count: messageCount,
        },
      },
    });
  } catch (err) {
    return reply(err);
  }
};
