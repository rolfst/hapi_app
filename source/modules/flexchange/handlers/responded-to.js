import * as flexchangeService from '../services/flexchange';
import * as responseUtil from '../../../common/utils/response';

export default async (req, reply) => {
  const message = { ...req.pre, ...req.auth };

  try {
    const result = await flexchangeService.listRespondedTo({}, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
