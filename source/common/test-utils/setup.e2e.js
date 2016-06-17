import { Server } from 'hapi';
import { assert } from 'chai';
import { getRequest } from 'common/test-utils/request';
import jwtStrategy from 'common/middlewares/authenticator-strategy';
import { roles } from 'common/services/permission';

describe('Setup', () => {
  let server;

  before(() => {
    server = new Server();
    server.connection({ port: 2000 });
    server.auth.scheme('jwt', jwtStrategy);
    server.auth.strategy('jwt', 'jwt');
    server.auth.default('jwt');
  });

  it('should create Flex-Appeal network', () => {
    const integrations = global.network.Integrations;

    assert.lengthOf(integrations, 0);
  });

  it('should create PMT network', () => {
    const integrations = global.pmtNetwork.Integrations;

    assert.lengthOf(integrations, 1);
    assert.equal(integrations[0].name, 'PMT');
  });

  it('should set the admin scope to logged user', async () => {
    server.route({
      method: 'GET',
      path: '/test-scope/{networkId}',
      handler: (req, reply) => reply(req.auth.credentials),
      config: {
        auth: { access: { scope: roles.ADMIN } },
      },
    });

    const res = await getRequest(`/test-scope/${global.network.id}`, server);
    const expected = roles.ADMIN;
    const actual = res.result.scope;

    assert.equal(actual, expected);
  });
});
