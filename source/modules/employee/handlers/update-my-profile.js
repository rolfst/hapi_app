import * as service from '../services/employee.js';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  const { pre, auth } = req;
  const message = { ...pre, ...auth };

  try {
    const payload = { attributes: req.payload };
    const updatedUser = await service.updateEmployee(payload, message);

    return reply({ success: true, data: responseUtil.serialize(updatedUser) });
  } catch (err) {
    return reply(err);
  }
};
