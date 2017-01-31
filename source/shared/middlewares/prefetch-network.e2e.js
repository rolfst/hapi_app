import { Server } from 'hapi';
import { assert } from 'chai';
import jwtStrategy from './authenticator-strategy';
import * as testHelper from '../test-utils/helpers';
import { getRequest } from '../test-utils/request';
import preFetchNetwork from '../middlewares/prefetch-network';

describe('Plugin: Network', () => {
  let server;
  let admin;
  let employee;
  let pmtNetwork;

  before(async () => {
    admin = await testHelper.createUser({ password: 'foo' });
    employee = await testHelper.createUser({ password: 'bar' });
    const { network } = await testHelper.createNetworkWithIntegration({
      name: 'pmt',
      userId: admin.id,
    });
    pmtNetwork = network;
  });

  after(async () => testHelper.cleanAll());

  beforeEach(() => {
    server = new Server();
    server.connection({ port: 2000 });
    server.auth.scheme('jwt', jwtStrategy);
    server.auth.strategy('jwt', 'jwt');

    server.route({
      method: 'GET',
      path: '/v2/networks/{networkId}',
      handler: (req, reply) => reply(req.pre.network),
      config: {
        auth: 'jwt',
        pre: [{ method: preFetchNetwork, assign: 'network' }],
      },
    });
  });

  afterEach(() => server.stop());

  it('should add network to request', async () => {
    const networkId = pmtNetwork.id;
    const res = await getRequest(`/v2/networks/${networkId}`, admin.token, server);

    assert.equal(res.result.id, networkId);
    assert.equal(res.statusCode, 200);
  });

  it('should respond with 404 when network is not found', async () => {
    const endpoint = '/v2/networks/1823918319813';
    const res = await getRequest(endpoint, employee.token, server);

    assert.equal(res.statusCode, 404);
  });

  it('should fail when user does not belong to the network', async () => {
    const endpoint = `/v2/networks/${pmtNetwork.id}`;
    const res = await getRequest(endpoint, employee.token, server);

    assert.equal(res.statusCode, 403);
  });
});
