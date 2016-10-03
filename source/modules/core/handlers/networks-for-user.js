import * as networkService from '../services/network';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  const message = { ...req.pre, ...req.auth };
  const data = networkService.listNetworksForCurrentUser(null, message);

  return reply({ data: responseUtil.serialize(data) });
};
