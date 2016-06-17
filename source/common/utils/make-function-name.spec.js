import { assert } from 'chai';
import { User, Network, Team, NetworkUser } from 'common/models';
import makeFunctionName from 'common/utils/make-function-name';

let network1;
let network2;
let network3;
let team1;
let team2;
let user;

describe('makeFunctionName', () => {
  before(() => {
    const networkUserInstance = NetworkUser.build({ id: 1, deletedAt: null });
    const networkUserDeletedInstance = NetworkUser.build({ id: 1, deletedAt: new Date() });

    const network1Instance = Network.build({ id: 1, name: 'Cool network' });
    const network2Instance = Network.build({ id: 2, name: 'Cool other network' });
    const network3Instance = Network.build({ id: 3, name: 'Cool network where user is deleted' });

    network1 = Object.assign(network1Instance, { NetworkUser: networkUserInstance });
    network2 = Object.assign(network2Instance, { NetworkUser: networkUserInstance });
    network3 = Object.assign(network3Instance, { NetworkUser: networkUserDeletedInstance });
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
    const userInstance = Object.assign({}, user);
    userInstance.Networks = [network3];

    assert.equal(makeFunctionName(network3.id, userInstance), 'Verwijderd');
  });

  it('return correct function name when user is not in any team', () => {
    const userInstance = Object.assign({}, user);
    userInstance.Teams = [];
    userInstance.Networks = [network1, network2];

    const result = makeFunctionName(network1.id, userInstance);

    assert.equal(result, 'Cool network');
  });
});
