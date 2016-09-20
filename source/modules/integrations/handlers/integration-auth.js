import * as accessService from '../services/access';

export default async (req, reply) => {
  const message = { ...req.pre, ...req.auth, deviceName: req.headers['user-agent'] };
  const payload = { ...req.payload, ...req.params };

  try {
    const accessToken = await accessService.getAccessToken(payload, message);

    return reply({ data: { access_token: accessToken } });
  } catch (err) {
    return reply(err);
  }
};
