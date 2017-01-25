import { assert } from 'chai';
import * as networkRepository from './network';

describe('Repository: Network', () => {
  describe('findUsersForNetwork', () => {
    it('should include network link data', async () => {
      const actual = await networkRepository.findUsersForNetwork({
        networkId: global.networks.flexAppeal.id,
      });

      assert.lengthOf(actual, 2);
      assert.equal(actual[0].roleType, 'ADMIN');
      assert.equal(actual[0].function, 'Beheerder');
      assert.equal(actual[1].roleType, 'EMPLOYEE');
      assert.equal(actual[1].function, 'Medewerker');
    });

    it('should be able to select users for roleType', async () => {
      const actual = await networkRepository.findUsersForNetwork({
        networkId: global.networks.flexAppeal.id,
        roleType: 'ADMIN',
      });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].roleType, 'ADMIN');
      assert.equal(actual[0].function, 'Beheerder');
    });
  });
});
