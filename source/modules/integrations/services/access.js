import { pick } from 'lodash';
import createAdapter from '../../../shared/utils/create-adapter';
import * as userRepo from '../../../shared/repositories/user';
import * as authenticationRepo from '../../../shared/repositories/authentication';
import createAccessToken from '../../authentication/utils/create-access-token';
import * as impl from './impl';

export const getLinkedAccessToken = async (payload, message) => {
  try {
    const credentials = pick(payload, 'username', 'password');
    const adapter = createAdapter(message.network, null, { proceedWithoutToken: true });
    const authResult = await adapter.authenticate(credentials);

    // Else we get different users that are connected with the
    // same account from an integration partner.
    await impl.assertExternalIdNotPresentInNetwork(
      message.credentials.id, message.network.id, authResult.externalId);

    const device = await authenticationRepo.findOrCreateUserDevice(
      message.credentials.id, message.deviceName);

    userRepo.setIntegrationToken(message.credentials, message.network, authResult.token);
    userRepo.setExternalId(message.credentials.id, message.network.id, authResult.externalId);

    return createAccessToken(message.credentials.id, device.device_id, [authResult]);
  } catch (err) {
    throw err;
  }
};