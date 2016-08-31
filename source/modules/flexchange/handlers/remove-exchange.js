import { deleteExchangeById } from 'modules/flexchange/repositories/exchange';

export default async (req, reply) => {
  try {
    await deleteExchangeById(req.params.exchangeId);

    return reply({ success: true });
  } catch (err) {
    return reply(err);
  }
};
