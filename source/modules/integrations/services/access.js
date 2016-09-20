import createAdapter from '../../../shared/utils/create-adapter';
import * as userRepo from '../../../shared/repositories/user';
import * as authenticationService from '../../authentication/services/authentication';

export const getAccessToken = async (payload, message) => {
  try {
    const adapter = createAdapter(message.network, null, { proceedWithoutToken: true });
    const authResult = await adapter.authenticate(payload);
    const options = { ...payload, integrationSettings: authResult };

    const { accessToken: newAccessToken } = await authenticationService
      .getAuthenticationTokens(options, message);

    userRepo.setIntegrationToken(message.credentials, message.network, authResult.token);

    return newAccessToken;
  } catch (err) {
    throw err;
  }
};
