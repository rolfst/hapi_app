import * as syncService from '../services/sync';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = {
      networkid: req.params.networkId,
      ownerEmail: req.payload.external_email,
    };

    await syncService.importNetwork(payload, message);

    return reply().code(202);
  } catch (err) {
    return reply(err);
  }
};
