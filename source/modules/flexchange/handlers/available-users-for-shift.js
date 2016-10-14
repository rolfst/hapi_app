import * as responseUtil from '../../../shared/utils/response';
import * as flexchangeService from '../services/flexchange';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.params, ...req.query };
    const response = await flexchangeService.listAvailableUsersForShift(payload, message);

    return reply({ data: responseUtil.toSnakeCase(response) });
  } catch (err) {
    return reply(err);
  }
};
