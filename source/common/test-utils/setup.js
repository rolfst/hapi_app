import authenticate from 'common/test-utils/authenticate';
import { createNetwork, deleteNetwork } from 'common/repositories/network';
import createServer from 'server';

global.server = createServer(8000);

before(() => {
  return authenticate({}).then(({ authUser, authToken }) => {
    return createNetwork(authUser.id).then(createdNetwork => {
      global.network = createdNetwork;

      authUser.set('scope', 'ADMIN');

      global.authToken = authToken;
      global.authUser = authUser;
    });
  });
});

after(() => {
  if (global.network) return deleteNetwork(global.network.id);
});
