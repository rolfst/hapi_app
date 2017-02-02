import { assert } from 'chai';
import R from 'ramda';
import * as networkRepository from './network';

describe('Repository: Network', () => {
  describe('findUsersForNetwork', () => {
    it('should include network link data', async () => {
      const actual = await networkRepository.findUsersForNetwork({
        networkId: global.networks.flexAppeal.id,
      });

      const admin = R.find(R.propEq('roleType', 'ADMIN'), actual);
      const employee = R.find(R.propEq('roleType', 'EMPLOYEE'), actual);

      assert.lengthOf(actual, 2);
      assert.equal(admin.roleType, 'ADMIN');
      assert.equal(admin.function, 'Beheerder');
      assert.equal(employee.roleType, 'EMPLOYEE');
      assert.equal(employee.function, 'Medewerker');
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
