const { assert } = require('chai');
const Hapi = require('hapi');
const testHelper = require('../../../shared/test-utils/helpers.js');
const serverUtil = require('../../../shared/utils/server');
const { createRoutes } = require('../../../shared/utils/create-routes');
const { getRequest } = require('../../../shared/test-utils/request');
const { ERoleTypes, ERoutePermissions } = require('../../authorization/definitions');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const authenticationStrategy = require('../middleware');

const requestHandler = (req, reply) => {
  const { message } = createServicePayload(req);

  assert.property(message, 'credentials');
  assert.property(message.credentials, 'user');
  assert.property(message.credentials, 'context');

  return reply();
};

const createServer = () => {
  const serverConfig = {
    host: '127.0.0.1',
    port: 2000,
    routes: {
      cors: {
        origin: ['*'],
        headers: ['Origin', 'X-API-Token', 'Content-Type', 'Accept'],
      },
    },
  };
  const server = new Hapi.Server(serverUtil.makeConfig());
  server.connection(serverConfig);

  // Register plugins
  server.register(require('hapi-async-handler')); // eslint-disable-line global-require
  // Register schemes + strategies
  server.auth.scheme('jwt', authenticationStrategy);
  server.auth.strategy('jwt', 'jwt');

  // Register server extensions
  server.ext('onRequest', serverUtil.onRequest());
  server.ext('onPreResponse', serverUtil.onPreResponse());

  // Register routes
  const routes = createRoutes([
    {
      method: 'GET',
      url: '/networks/{networkId}/test',
      handler: requestHandler,
      permissions: ERoutePermissions.NETWORK_USER,
    }, {
      method: 'GET',
      url: '/networks/{networksId}/testOnlyAdmins',
      handler: requestHandler,
      permissions: [ERoutePermissions.NETWORK_ADMIN],
      prefetch: false,
    }, {
      method: 'GET',
      url: '/organisations/{organisationId}/test',
      handler: requestHandler,
      prefetch: false,
      permissions: [ERoutePermissions.ORGANISATION_USER],
    }, {
      method: 'GET',
      url: '/teams/{teamId}/test',
      handler: requestHandler,
      permissions: [ERoutePermissions.TEAM_MEMBER],
      prefetch: false,
    }, {
      method: 'GET',
      url: '/organisations/{organisationId}/testOnlyAdmins',
      handler: requestHandler,
      permissions: [ERoutePermissions.ORGANISATION_ADMIN],
      prefetch: false,
    }, {
      method: 'GET',
      url: '/users/me',
      handler: requestHandler,
      prefetch: false,
    }, {
      method: 'GET',
      url: '/login',
      handler: (req, reply) => reply({ data: { token: 'token' } }),
      auth: false,
      prefetch: false,
    },
  ]);
  routes.map((route) => server.route(route));

  return server;
};

describe('Middleware: Authentication', () => {
  let server;
  let admin;
  let superAdmin;
  let networkAdmin;
  let user;
  let otherUser;
  let organisationAdmin;
  let organisation;
  let network;
  let team;

  before(async () => {
    server = createServer();

    [organisation, admin, networkAdmin, user, organisationAdmin, superAdmin, otherUser] =
    await Promise.all([
      testHelper.createOrganisation(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
      testHelper.createUser(),
    ]);

    [network] = await Promise.all([
      testHelper.createNetwork({ userId: admin.id, organisationId: organisation.id }),
      testHelper.createNetwork({ userId: admin.id, organisationId: organisation.id }),
      testHelper
      .addUserToOrganisation(admin.id, organisation.id, ERoleTypes.ADMIN),
      testHelper.createNetwork({ userId: admin.id, organisationId: organisation.id }),
      testHelper
      .addUserToOrganisation(superAdmin.id, organisation.id, ERoleTypes.ADMIN),
      testHelper
      .addUserToOrganisation(organisationAdmin.id, organisation.id, ERoleTypes.ADMIN),
      testHelper.addUserToOrganisation(user.id, organisation.id),
      testHelper.addUserToOrganisation(networkAdmin.id, organisation.id),
    ]);

    team = await testHelper.createTeamInNetwork(network.id);

    await Promise.all([
      testHelper.addUserToNetwork(
        { networkId: network.id, userId: networkAdmin.id, roleType: ERoleTypes.ADMIN }),
      testHelper.addUserToNetwork(
        { networkId: network.id, userId: superAdmin.id, roleType: ERoleTypes.ADMIN }),
      testHelper.addUserToNetwork(
        { networkId: network.id, userId: user.id }),
      testHelper.addUserToTeam(team.id, user.id),
      testHelper.addUserToTeam(team.id, networkAdmin.id),
      testHelper.addUserToTeam(team.id, superAdmin.id),
    ]);
  });

  after(() => testHelper.cleanAll());

  it('should pass with correct admin permissions on an organisation', async () => {
    const endpoint = `/organisations/${organisation.id}/test`;
    const { statusCode } = await getRequest(endpoint, admin.token, server);

    assert.equal(statusCode, 200);
  });

  it('should pass with correct user permissions on an organisation', async () => {
    const endpoint = `/organisations/${organisation.id}/test`;
    const { statusCode } = await getRequest(endpoint, user.token, server);

    assert.equal(statusCode, 200);
  });

  it('should NOT pass with incorrect admin permissions on an organisation', async () => {
    const endpoint = `/organisations/${organisation.id}/testOnlyAdmins`;
    const response = await getRequest(endpoint, user.token, server);
    const { statusCode } = response;

    assert.equal(statusCode, 403);
  });

  it('should NOT pass while not part of an organisation', async () => {
    const endpoint = `/organisations/${organisation.id}/test`;
    const { statusCode } = await getRequest(endpoint, otherUser.token, server);

    assert.equal(statusCode, 403);
  });

  it('should pass admin with correct permissions on an network', async () => {
    const endpoint = `/networks/${network.id}/test`;
    const { statusCode } = await getRequest(endpoint, admin.token, server);

    assert.equal(statusCode, 200);
  });

  it('should pass user with correct permissions on an network', async () => {
    const endpoint = `/networks/${network.id}/test`;
    const { statusCode } = await getRequest(endpoint, user.token, server);

    assert.equal(statusCode, 200);
  });

  it('should pass with correct user permissions on a team', async () => {
    const endpoint = `/teams/${team.id}/test`;
    const { statusCode } = await getRequest(endpoint, user.token, server);

    assert.equal(statusCode, 200);
  });

  it('should pass with organisation admin role permissions on a team route', async () => {
    const endpoint = `/teams/${team.id}/test`;
    const { statusCode } = await getRequest(endpoint, organisationAdmin.token, server);

    assert.equal(statusCode, 200);
  });

  it('should pass with organisation admin and network admin role permissions on a team route', async () => {
    const endpoint = `/teams/${team.id}/test`;
    const { statusCode } = await getRequest(endpoint, superAdmin.token, server);

    assert.equal(statusCode, 200);
  });

  it('should pass when no permissions are required', async () => {
    const endpoint = '/users/me';
    const { statusCode } = await getRequest(endpoint, user.token, server);

    assert.equal(statusCode, 200);
  });

  it('should return with token', async () => {
    const endpoint = '/login';
    const response = await getRequest(endpoint, user.token, server);
    const { result, statusCode } = response;
    assert.equal(result.data.token, 'token');
    assert.equal(statusCode, 200);
  });
});
