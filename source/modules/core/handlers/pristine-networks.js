import * as networkService from '../services/network';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const data = await networkService.listPristineNetworks(null, message);

    return reply({ data });
  } catch (err) {
    console.log('error listing pristine networks', err);
    return reply(err);
  }
};
