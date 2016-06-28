import { Server } from 'hapi';
import { assert } from 'chai';
import jwtStrategy from 'common/middlewares/authenticator-strategy';

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
      const integrations = global.networks.flexAppeal.Integrations;

      assert.lengthOf(integrations, 0);
    });
  });

  describe('PMT', () => {
    it('should create network', () => {
      const integrations = global.networks.pmt.Integrations;

      assert.lengthOf(integrations, 1);
      assert.equal(integrations[0].name, 'PMT');
    });

    it('should have user token for user', () => {
      //
    });
  });
});
