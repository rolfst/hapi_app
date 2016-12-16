import * as networkService from '../services/network';

export default async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };

    await networkService.importNetwork(payload, message);

    return reply().code(202);
  } catch (err) {
    return reply(err);
  }
};
