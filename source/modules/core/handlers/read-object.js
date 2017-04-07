const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const objectService = require('../services/object');
const Sequelize = require('sequelize');
const createError = require('../../../shared/utils/create-error');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const data = await objectService.markAsRead(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    if (err instanceof Sequelize.UniqueConstraintError) {
      return reply(createError(50001, 'Tried to see an object more than once'));
    }

    return reply(err);
  }
};
