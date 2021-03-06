const { assert } = require('chai');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const teamRepo = require('../../core/repositories/team');
const networkRepo = require('../../core/repositories/network');
const { exchangeTypes } = require('../repositories/dao/exchange');
const { getRequest } = require('../../../shared/test-utils/request');
const exchangeRepo = require('../repositories/exchange');

describe('View users related to exchange', () => {
  describe('Network without integration', () => {
    let network;
    let admin;
    let employee;

    before(async () => {
      [admin, employee] = await Promise.all([
        testHelper.createUser(),
        testHelper.createUser(),
      ]);
      network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
      await testHelper.addUserToNetwork({
        userId: employee.id,
        networkId: network.id,
      });
    });

    it('should return users for exchange created for network', async () => {
      const exchange = await exchangeRepo.createExchange(admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.NETWORK,
      });

      const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/users`;
      const { result, statusCode } = await getRequest(endpoint, admin.token);
      const usersInNetwork = await networkRepo.findUsersForNetwork(network.id);

      assert.equal(statusCode, 200);
      assert.equal(result.data.length, usersInNetwork.length - 1);
      assert.isDefined(result.data[0].function);

      await exchangeRepo.deleteById(exchange.id);
    });

    it('should return correct properties', async () => {
      const exchange = await exchangeRepo.createExchange(admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.USER,
        values: [employee.id, admin.id],
      });

      const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/users`;
      const { result, statusCode } = await getRequest(endpoint, admin.token);

      const expectedProperties = [
        'type',
        'id',
        'username',
        'first_name',
        'last_name',
        'full_name',
        'phone_num',
        'email',
        'external_id',
        'integration_auth',
        'function',
        'role_type',
        'profile_img',
        'date_of_birth',
        'created_at',
        'deleted_at',
        'last_login',
      ];

      assert.equal(statusCode, 200);

      expectedProperties.forEach((property) => assert.property(result.data[0], property));

      await exchangeRepo.deleteById(exchange.id);
    });

    after(() => testHelper.cleanAll());

    it('should return users for exchange created for user', async () => {
      const exchange = await exchangeRepo.createExchange(admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.USER,
        values: [employee.id, admin.id],
      });

      const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/users`;
      const { result, statusCode } = await getRequest(endpoint, admin.token);

      assert.equal(statusCode, 200);
      assert.equal(result.data.length, 1);
      assert.isDefined(result.data[0].function);

      await exchangeRepo.deleteById(exchange.id);
    });

    it('should return users for exchange created for team', async () => {
      const team = await teamRepo.create({ networkId: network.id, name: 'Cool Team' });
      await teamRepo.addUserToTeam(team.id, admin.id);

      const exchange = await exchangeRepo.createExchange(admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.TEAM,
        values: [team.id],
      });

      const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/users`;
      const { result, statusCode } = await getRequest(endpoint, employee.token);

      assert.equal(statusCode, 200);
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].id, admin.id);
      assert.isDefined(result.data[0].function);

      await teamRepo.deleteById(team.id);
      await exchangeRepo.deleteById(exchange.id);
    });
  });
});
