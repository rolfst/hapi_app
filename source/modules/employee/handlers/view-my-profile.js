import * as service from '../services/employee';
import * as responseUtil from '../../../common/utils/response';

export default async (req, reply) => {
  try {
    const { pre, auth } = req;
    const message = { ...pre, ...auth };

    const payload = { ...req.params, ...req.payload };
    const user = await service.getEmployee(payload, message);

    return reply({ data: responseUtil.serialize(user) });
  } catch (err) {
    return reply(err);
  }
};
