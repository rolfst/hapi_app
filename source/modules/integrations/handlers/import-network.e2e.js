import { find } from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';
import * as createAdapter from 'shared/utils/create-adapter';
import stubs from 'shared/test-utils/fixtures';
import { getRequest } from 'shared/test-utils/request';
import * as networkRepo from 'shared/repositories/network';
import * as userRepo from 'shared/repositories/user';
import * as teamRepo from 'shared/repositories/team';
import * as integrationRepo from 'shared/repositories/integration';

describe('Network import', () => {
  let network;
  let integration;

  before(async () => {
    const fakeAdapter = {
      fetchTeams: () => stubs.externalTeams,
      fetchUsers: () => stubs.externalUsers,
    };

    sinon.stub(createAdapter, 'default').returns(fakeAdapter);

    integration = await integrationRepo.createIntegration({
      name: 'NEW_INTEGRATION',
      token: 'footoken',
    });

    network = await networkRepo.createIntegrationNetwork({
      userId: global.users.admin.id,
      externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
      name: 'My PMT network',
      integrationName: 'NEW_INTEGRATION',
    });

    await userRepo.createUser({
      username: 'dubbelganger@pmt.nl',
      email: 'dubbelganger@pmt.nl',
      firstName: 'Dubbelganger',
      lastName: 'Doe',
    });

    await teamRepo.createTeam({
      networkId: network.id,
      externalId: 2,
      name: 'Algemeen',
    });

    await getRequest(`/v2/networks/${network.id}/import`, global.server, 'footoken');
  });

  after(async () => {
    const users = await networkRepo.findAllUsersForNetwork(network);
    await Promise.all([
      ...users.map(u => u.destroy()),
      integration.destroy(),
    ]);

    createAdapter.default.restore();

    return network.destroy();
  });

  it('should add new teams to network', async () => {
    const teams = await networkRepo.findTeamsForNetwork(network);
    const actual = find(teams, { externalId: stubs.externalTeams[0].externalId });

    assert.lengthOf(teams, stubs.externalTeams.length);
    assert.isDefined(actual);
    assert.equal(actual.name, stubs.externalTeams[0].name);
  });

  it('should add new admins to network', async () => {
    const admins = await networkRepo.findAdminsByNetwork(network);

    assert.lengthOf(admins, 1);
    assert.equal(admins[0].NetworkUser.externalId, 1);
  });

  it('should add new users to network', async () => {
    const activeUsers = await networkRepo.findActiveUsersForNetwork(network);

    assert.lengthOf(activeUsers, 3);
  });

  it('should add new users to teams', async () => {
    const teams = await networkRepo.findTeamsForNetwork(network);
    const actual = find(teams, { externalId: stubs.externalTeams[0].externalId });

    assert.lengthOf(actual.Users, 2);
  });
});
