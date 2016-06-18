import 'babel-polyfill';
import dotenv from 'dotenv';
import createServer from 'server';
import { roles } from 'common/services/permission';
import authenticate from 'common/test-utils/authenticate';
import { createNetwork, createPmtNetwork, deleteNetwork } from 'common/repositories/network';
import generateNetworkName from 'common/test-utils/create-network-name';

dotenv.config();

global.server = createServer(8000);

before(() => {
  return authenticate(global.server).then(({ authUser, authToken, authIntegrations }) => {
    global.authIntegrations = authIntegrations;
    global.authToken = authToken;

    const flexAppealNetwork = createNetwork(authUser.id, generateNetworkName())
      .then(createdNetwork => {
        return createdNetwork.addUser(authUser, { roleType: roles.ADMIN }).then(() => {
          return createdNetwork.reload()
            .then(network => (global.network = network));
        });
      });

    const pmtNetwork = createPmtNetwork(authUser.id, generateNetworkName())
      .then(createdNetwork => {
        return createdNetwork.addUser(authUser, { roleType: roles.ADMIN }).then(() => {
          return createdNetwork.reload()
            .then(network => (global.pmtNetwork = network));
        });
      });

    return Promise.all([flexAppealNetwork, pmtNetwork])
      .then(() => authUser.reload())
      .then(user => {
        user.set('scope', 'ADMIN');
        global.authUser = user;
      });
  });
});

after(() => {
  if (global.network) {
    return Promise.all([
      deleteNetwork(global.network.id),
      deleteNetwork(global.pmtNetwork.id),
    ]);
  }
});
