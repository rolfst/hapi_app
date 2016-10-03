import * as flexchangeService from '../services/flexchange';

export default async (req, reply) => {
  try {
    const payload = { exchangeId: req.params.exchangeId };
    await flexchangeService.deleteExchange(payload);

    return reply({ success: true });
  } catch (err) {
    return reply(err);
  }
};
