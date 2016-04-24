import authenticate from 'common/test-utils/authenticate';
import createServer from 'server';

global.server = createServer(8000);

before(() => {
  return authenticate({}).then(({ authUser, authToken }) => {
    global.authToken = authToken;
    global.authUser = authUser;
  });
});
