import 'babel-polyfill';
import authenticate from 'common/test-utils/authenticate';
import { createNetwork, createPmtNetwork, deleteNetwork } from 'common/repositories/network';
import createServer from 'server';
import dotenv from 'dotenv';

dotenv.config();

global.server = createServer(8000);

before(() => {
  return authenticate(global.server).then(({ authUser, authToken, authIntegrations }) => {
    global.authIntegrations = authIntegrations;
    global.authToken = authToken;

    const flexAppealNetwork = createNetwork(authUser.id).then(createdNetwork => {
      return createdNetwork.setUsers([authUser]).then(() => {
        return createdNetwork.reload()
          .then(network => (global.network = network));
      });
    });

    const pmtNetwork = createPmtNetwork(authUser.id).then(createdNetwork => {
      return createdNetwork.setUsers([authUser]).then(() => {
        return createdNetwork.reload()
          .then(network => (global.pmtNetwork = network));
      });
    });

    return Promise.all([flexAppealNetwork, pmtNetwork])
      .then(() => authUser.reload())
      .then(user => (global.authUser = user));
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
