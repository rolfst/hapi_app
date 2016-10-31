import * as networkService from '../services/network';

export default async (req, reply) => {
  try {
    const payload = { ...req.params, ...req.payload };
    const message = { ...req.pre, ...req.auth };
    const admins = await networkService.listAdminsFromNetwork(payload, message);

    return reply({ success: true, data: admins });
  } catch (err) {
    console.log('Something went wrong while retrieving admins from network', err);
    return reply(err);
  }
};
