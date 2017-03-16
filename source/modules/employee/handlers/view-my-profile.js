const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const employeeService = require('../services/employee');

const logger = Logger.createLogger('EMPLOYEE/handler/viewProfile');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.payload };

    logger.info('Retrieving profile for authenticated user', { payload, message });
    const user = await employeeService.getEmployee(payload, message);

    return reply({ data: responseUtil.toSnakeCase(user) });
  } catch (err) {
    return reply(err);
  }
};
