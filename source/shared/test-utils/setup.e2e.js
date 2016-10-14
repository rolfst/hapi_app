import { Server } from 'hapi';
import { assert } from 'chai';
import jwtStrategy from '../middlewares/authenticator-strategy';

describe('Setup', () => {
  let server; // eslint-disable-line prefer-const

  before(() => {
    server = new Server();
    server.connection({ port: 2000 });
    server.auth.scheme('jwt', jwtStrategy);
    server.auth.strategy('jwt', 'jwt');
    server.auth.default('jwt');
  });

  describe('Flex-Appeal', () => {
    it('should create network', () => {
      assert.isFalse(global.networks.flexAppeal.hasIntegration);
    });
  });

  describe('PMT', () => {
    it('should create network', () => {
      assert.isTrue(global.networks.pmt.hasIntegration);
      assert.equal(global.networks.pmt.integrations[0], 'PMT');
    });
  });
});
