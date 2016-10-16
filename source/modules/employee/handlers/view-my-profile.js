import * as responseUtil from '../../../shared/utils/response';
import * as employeeService from '../services/employee';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.payload };
    const user = await employeeService.getEmployee(payload, message);

    return reply({ data: responseUtil.toSnakeCase(user) });
  } catch (err) {
    console.log('Error retrieving profile for authenticated user', err);
    return reply(err);
  }
};
