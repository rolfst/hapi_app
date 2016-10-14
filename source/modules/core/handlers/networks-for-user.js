import * as networkService from '../services/network';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { id: req.auth.credentials.id };
    const data = await networkService.listNetworksForUser(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    console.log('Error retrieving networks for user', err);
    return reply(err);
  }
};
