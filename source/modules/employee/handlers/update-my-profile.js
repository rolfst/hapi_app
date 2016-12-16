import { mapKeys, camelCase } from 'lodash';
import * as service from '../services/employee';
import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';

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
