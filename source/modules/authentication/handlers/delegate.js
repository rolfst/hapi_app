import * as authenticationService from 'modules/authentication/services/authentication';

export default async (request, reply) => {
  try {
    const payload = { refreshToken: request.query.refresh_token };
    const message = { ...request.pre, ...request.auth };
    message.deviceName = request.headers['user-agent'];

    const result = await authenticationService.delegate(payload, message);

    return reply({ success: true, data: { access_token: result.refreshedAccessToken } });
  } catch (err) {
    return reply(err);
  }
};
