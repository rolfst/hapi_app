import * as networkService from '../services/network';

export default async (req, reply) => {
  const payload = { networkId: req.params.networkId };
  const message = { ...req.pre, ...req.auth };

  try {
    await networkService.importNetwork(payload, message);

    return reply({ success: true });
  } catch (err) {
    console.error('Could not import network', {
      stack: err.stack,
      network_id: req.params.networkId,
    });

    return reply(err);
  }
};
