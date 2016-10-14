import * as networkService from '../../modules/core/services/network';
import * as serverUtil from '../utils/server';

export default async (req, reply) => {
  try {
    const message = { ...req.auth };
    const payload = { id: req.params.networkId };
    const network = await networkService.getNetwork(payload, message);

    return reply(network);
  } catch (err) {
    console.log('Error in the prefetch network middleware', err);
    const errorResponse = serverUtil.transformBoomToErrorResponse(err);

    return reply(errorResponse).takeover().code(403);
  }
};
