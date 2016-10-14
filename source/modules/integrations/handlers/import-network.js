import * as importService from '../services/import';

export default async (req, reply) => {
  const payload = { networkId: req.params.networkId };
  const message = { ...req.pre, ...req.auth };

  try {
    await importService.importNetwork(payload, message);

    return reply({ success: true });
  } catch (err) {
    console.error('Could not import network', err, { network_id: req.params.networkId });

    return reply(err);
  }
};
