import * as AuthenticationService from 'modules/authentication/services/authentication';

export default async (request, reply) => {
  try {
    const payload = { refreshToken: request.query.refresh_token };
    const result = await AuthenticationService.delegate(payload, { request });

    return reply({ success: true, data: { access_token: result.refreshedAccessToken } });
  } catch (err) {
    return reply(err);
  }
};
