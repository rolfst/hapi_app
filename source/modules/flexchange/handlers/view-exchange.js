import * as flexchangeService from '../services/flexchange';
import * as responseUtil from 'common/utils/response';

export default async (req, reply) => {
  const payload = { exchangeId: req.params.exchangeId };
  const message = { ...req.pre, ...req.auth };

  try {
    const result = await flexchangeService.getExchange(payload, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
