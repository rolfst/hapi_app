import * as flexchangeService from '../services/flexchange';

export default async (req, reply) => {
  const payload = { exchangeId: req.params.exchangeId };
  const message = { ...req.pre, ...req.auth };

  try {
    const result = await flexchangeService.listReceivers(payload, message);

    return reply({ data: result.map(r => r.toJSON()) });
  } catch (err) {
    console.log(err);
    return reply(err);
  }
};
