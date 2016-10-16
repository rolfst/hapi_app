import * as flexchangeService from '../services/flexchange';

export default async (req, reply) => {
  try {
    const payload = { exchangeId: req.params.exchangeId };
    const message = { ...req.pre, ...req.auth };
    const result = await flexchangeService.listReceivers(payload, message);

    return reply({ data: result });
  } catch (err) {
    console.log('Error retrieving receivers for flexchange shift', err);
    return reply(err);
  }
};
