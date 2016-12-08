import { assert } from 'chai';
import Promise from 'bluebird';
import * as userRepo from './user';
import * as networkRepo from './network';
import * as teamRepo from './team';

describe('Team repository', () => {
  let user;
  let network;
  let network2;

  before(async () => {
    user = await userRepo.createUser({
      username: 'duplicateTeam@flex-appeal.nl',
      firstName: 'dup',
      lastName: 'team',
      email: 'duplicateTeam@flex-appeal.nl',
      password: 'fake',
    });

    network = await networkRepo.createNetwork(user.id, 'findExternalTeamNetwork');
    network2 = await networkRepo.createNetwork(user.id, 'secondNetwork');
  });

  after(() => userRepo.deleteById(user.id));

  afterEach(async () => {
    const [teams, teams2] = await Promise.all([
      networkRepo.findTeamsForNetwork(network.id),
      networkRepo.findTeamsForNetwork(network2.id),
    ]);

    return Promise.map([...teams, teams2], (team) => teamRepo.deleteById(team.id));
  });

  it('should fail when creating team in same network with same external id', async () => {
    await teamRepo.createTeam({ networkId: network.id, name: 'Team 1', externalId: '1' });
    await teamRepo.createTeam({ networkId: network2.id, name: 'Team1 network2', externalId: '1' });

    try {
      await teamRepo.createTeam({ networkId: network.id, name: 'duplicateTeam', externalId: '1' });
    } catch (err) {
      assert.equal(err.message, 'Validation error');
    }
  });
});