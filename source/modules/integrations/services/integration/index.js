const { pick } = require('lodash');
const { createAdapter } = require('../../../../shared/utils/create-adapter');
const userRepo = require('../../../core/repositories/user');
const authenticationRepo = require('../../../core/repositories/authentication');
const createAccessToken = require('../../../authentication/utils/create-access-token');
const impl = require('./implementation');

export async function authenticate(payload, message) {
  const credentials = pick(payload, 'username', 'password');
  const adapter = await createAdapter(message.network, 0, { proceedWithoutToken: true });
  const authResult = await adapter.authenticate(credentials);

  // Else we get different users that are connected with the
  // same account from an integration partner.
  await impl.assertExternalIdNotPresentInNetwork(
    message.credentials.id, message.network.id, authResult.externalId);

  const device = await authenticationRepo.findOrCreateUserDevice(
    message.credentials.id, message.deviceName);

  await userRepo.setNetworkLink({
    userId: message.credentials.id,
    networkId: message.network.id,
  }, {
    userId: message.credentials.id,
    networkId: message.network.id,
    userToken: authResult.token,
    externalId: authResult.externalId,
  });

  return createAccessToken(message.credentials.id, device.device_id);
}
