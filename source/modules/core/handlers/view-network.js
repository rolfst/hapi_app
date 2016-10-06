import * as networkService from '../services/network';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const data = await networkService.listNetwork({}, message);

    return reply({ data: responseUtil.serialize(data) });
  } catch (err) {
    console.log('Error retrieving network information', err);
    return reply(err);
  }
};
