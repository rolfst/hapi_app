import { pick } from 'lodash';
import * as AuthenticationService from 'modules/authentication/services/authentication';

/*
 * The authentication script first authenticates with the Flex-Appeal database
 * before going further. When the user is authenticated with the Flex-Appeal database
 * we try to authenticate the user with each integration of the network the user
 * belongs to. When the user is authenticated with an integration, we will
 * set the user_tokens retrieved from the integration. We also append the integrations
 * to the payload of the access token, so we can validate the user for requests that
 * are especially designed for networks that have an integration enabled.
 */
export default async (request, reply) => {
  const payload = pick(request.payload, 'username', 'password');

  try {
    const result = await AuthenticationService.authenticate(payload, { request });

    return reply({
      data: {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        last_login: result.user.lastLogin,
      },
    });
  } catch (err) {
    console.log(err);
    return reply(err);
  }
};
