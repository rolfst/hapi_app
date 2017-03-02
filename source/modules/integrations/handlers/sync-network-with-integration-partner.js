import * as syncService from '../services/sync';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.payload, ...req.params };

    syncService.syncNetwork(payload, message);

    return reply().code(202);
  } catch (err) {
    return reply(err);
  }
};
