import * as responseUtil from '../../../shared/utils/response';
import * as teamService from '../services/team';

export default async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.auth, ...req.pre };
    const data = await teamService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
