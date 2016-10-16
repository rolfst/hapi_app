import * as networkService from '../services/network';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.payload, ...req.params };
    await networkService.importPristineNetwork(payload, message);

    return reply({ data: { success: true } });
  } catch (err) {
    console.log('Error importing pristine network', err);
    return reply(err);
  }
};
