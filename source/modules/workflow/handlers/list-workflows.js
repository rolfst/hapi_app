const R = require('ramda');
const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const workflowService = require('../services/workflow');
const organisationService = require('../../core/services/organisation');
const createError = require('../../../shared/utils/create-error');

const logger = require('../../../shared/services/logger')('workflow/handler');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.debug('Fetching workflow stats', { payload, message });

    if (
      !(await organisationService.userHasRoleInOrganisation(
        payload.organisationId,
        message.credentials.id,
        organisationService.ERoleTypes.ADMIN))
    ) {
      throw createError('403');
    }

    const { data, counts } = await workflowService.stats(payload, message);

    return reply({
      data: responseUtil.toSnakeCase(data),
      meta: {
        pagination: R.merge({
          limit: payload.limit,
          offset: payload.offset,
          test: 'asd',
        }, counts),
      },
    });
  } catch (err) {
    return reply(err);
  }
};
