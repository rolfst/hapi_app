import { assert } from 'chai';
import * as networkUtil from 'common/utils/network';

describe('networkUtil', () => {
  describe('networkHasIntegration', () => {
    it('should check if network has integrations', () => {
      const networkFixtureWithoutIntegrations = {
        name: 'Flex-Appeal',
        Integrations: [],
      };

      const networkFixtureWithIntegrations = {
        name: 'PMT',
        Integrations: [{
          foo: 'baz',
        }],
      };

      assert.equal(networkUtil.hasIntegration(networkFixtureWithoutIntegrations), false);
      assert.equal(networkUtil.hasIntegration(networkFixtureWithIntegrations), true);
    });
  });

  describe('selectNetwork', () => {
    it('return the correct network', () => {
      const networks = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
      const actual = networkUtil.select(networks, 2);

      assert.deepEqual(actual, { id: 2 });
    });
  });

  describe('makeFunctionName', () => {
    let network1;
    let network2;
    let network3;
    let team1;
    let team2;
    let user;

    before(() => {
      const networkUserInstance = { id: 1, deletedAt: null };
      const networkUserDeletedInstance = { id: 1, deletedAt: new Date() };

      const network1Instance = { id: 1, name: 'Cool network' };
      const network2Instance = { id: 2, name: 'Cool other network' };
      const network3Instance = { id: 3, name: 'Cool network where user is deleted' };

      network1 = Object.assign(network1Instance, { NetworkUser: networkUserInstance });
      network2 = Object.assign(network2Instance, { NetworkUser: networkUserInstance });
      network3 = Object.assign(network3Instance, { NetworkUser: networkUserDeletedInstance });
      team1 = { name: 'Cool team', networkId: 1 };
      team2 = { name: 'Cool other team', networkId: 2 };
      user = { firstName: 'John', lastName: 'Doe' };
    });

    it('returns function name for team', () => {
      const userInstance = Object.assign({}, user);
      userInstance.Teams = [team1, team2];
      userInstance.Networks = [network1, network2];

      assert.equal(networkUtil.makeFunctionName(network1.id, userInstance), 'Cool team');
      assert.equal(networkUtil.makeFunctionName(network2.id, userInstance), 'Cool other team');
    });

    it('returns function name when user is deleted from network', () => {
      const userInstance = Object.assign({}, user);
      userInstance.Networks = [network3];

      assert.equal(networkUtil.makeFunctionName(network3.id, userInstance), 'Verwijderd');
    });

    it('return correct function name when user is not in any team', () => {
      const userInstance = Object.assign({}, user);
      userInstance.Teams = [];
      userInstance.Networks = [network1, network2];

      const result = networkUtil.makeFunctionName(network1.id, userInstance);

      assert.equal(result, 'Cool network');
    });
  });
});
