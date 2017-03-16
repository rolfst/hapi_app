const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const createError = require('../../../shared/utils/create-error');
const responseUtil = require('../../../shared/utils/response');
const eventService = require('../services/event');

module.exports = async (req, reply) => {
  try {
    const { message, payload } = createServicePayload(req);
    const viewEq = R.pathEq(['params', 'viewName']);

    const handler = R.cond([
      [viewEq('created_messages'), () => eventService.getCreatedMessages],
      [viewEq('created_shifts'), () => eventService.getCreatedShifts],
      [viewEq('approved_shifts'), () => eventService.getApprovedShifts],
      [R.T, () => null],
    ])(req);

    if (!handler) throw createError('404', 'View does not exist.');

    const stats = await handler(payload, message);

    return reply({ data: responseUtil.toSnakeCase(stats.payload) });
  } catch (err) {
    return reply(err);
  }
};
