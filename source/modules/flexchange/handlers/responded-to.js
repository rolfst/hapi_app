import * as flexchangeService from '../services/flexchange';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const result = await flexchangeService.listRespondedTo({}, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
