import { assert } from 'chai';
import R from 'ramda';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as networkRepository from './network';

describe('Repository: Network', () => {
  let network;

  before(async () => {
    const admin = await testHelper.createUser();
    const employee = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    return testHelper.addUserToNetwork({ userId: employee.id, networkId: network.id });
  });

  after(() => testHelper.cleanAll());

  describe('findUsersForNetwork', () => {
    it('should include network link data', async () => {
      const actual = await networkRepository.findUsersForNetwork({
        networkId: network.id,
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
        networkId: network.id,
        roleType: 'ADMIN',
      });

      assert.lengthOf(actual, 1);
      assert.equal(actual[0].roleType, 'ADMIN');
      assert.equal(actual[0].function, 'Beheerder');
    });
  });
});
