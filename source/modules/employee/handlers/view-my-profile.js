import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as employeeService from '../services/employee';

const logger = Logger.getLogger('EMPLOYEE/handler/viewProfile');

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
