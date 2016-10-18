import * as responseUtil from '../../../shared/utils/response';
import * as flexchangeService from '../services/flexchange';

export default async (req, reply) => {
  try {
    const payload = { exchangeId: req.params.exchangeId };
    const message = { ...req.pre, ...req.auth };
    const result = await flexchangeService.listReceivers(payload, message);

    return reply({ data: responseUtil.toSnakeCase(result) });
  } catch (err) {
    console.log('Error retrieving receivers for flexchange shift', err);
    return reply(err);
  }
};
