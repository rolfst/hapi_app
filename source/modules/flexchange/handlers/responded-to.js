import * as responseUtil from 'common/utils/response';
import * as exchangeRepo from '../repositories/exchange';

export default async (req, reply) => {
  try {
    const networkId = req.pre.network.id;
    const userId = req.auth.credentials.id;
    const exchanges = await exchangeRepo.getRespondedToExchange(userId, networkId);

    return reply({ data: responseUtil.serialize(exchanges) });
  } catch (err) {
    return reply(err);
  }
};
