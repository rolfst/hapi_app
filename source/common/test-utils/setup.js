import 'babel-polyfill';
import authenticate from 'common/test-utils/authenticate';
import { createNetwork, deleteNetwork } from 'common/repositories/network';
import createServer from 'server';
import dotenv from 'dotenv';

dotenv.config();

global.server = createServer(8000);

before(() => {
  return authenticate({}).then(({ authUser, authToken }) => {
    global.authToken = authToken;
    global.authUser = authUser;

    return createNetwork(authUser.id).then(createdNetwork => {
      global.network = createdNetwork;
    });
  });
});

after(() => {
  if (global.network) return deleteNetwork(global.network.id);
});
