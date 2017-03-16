const { mapKeys, camelCase } = require('lodash');
const service = require('../services/employee');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');

const logger = Logger.createLogger('EMPLOYEE/handler/updateMyProfile');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { attributes: mapKeys(req.payload, (val, key) => camelCase(key)) };

    logger.info('Updating profile', { message, payload });
    const updatedUser = await service.updateEmployee(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(updatedUser) });
  } catch (err) {
    return reply(err);
  }
};
