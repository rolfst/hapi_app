import { assert } from 'chai';
import { User, Network, Team } from 'common/models';
import makeFunctionName from 'common/utils/make-function-name';

let user;
let network1;
let network2;
let team1;
let team2;

describe('Function name', () => {
  before(() => {
    network1 = Network.build({ id: 1, name: 'Cool network' });
    network2 = Network.build({ id: 2, name: 'Cool other network' });
    team1 = Team.build({ name: 'Cool team', networkId: 1 });
    team2 = Team.build({ name: 'Cool other team', networkId: 2 });
    user = User.build({ firstName: 'John', lastName: 'Doe' });
  });

  it('returns function name for team', () => {
    const userInstance = Object.assign({}, user);
    userInstance.Teams = [team1, team2];
    userInstance.Networks = [network1, network2];

    assert.equal(makeFunctionName(network1.id, userInstance), 'Cool team');
    assert.equal(makeFunctionName(network2.id, userInstance), 'Cool other team');
  });

  it('returns function name when user is deleted from network', () => {

  });

  it('return correct function name when user is not in any team', () => {
    const userInstance = Object.assign({}, user);
    userInstance.Teams = [];
    userInstance.Networks = [network1, network2];

    const result = makeFunctionName(network1.id, userInstance);

    assert.equal(result, 'Cool network');
  });
});
