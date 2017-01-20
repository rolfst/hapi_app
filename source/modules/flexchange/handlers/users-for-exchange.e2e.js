import { assert } from 'chai';
import moment from 'moment';
import * as teamRepo from '../../core/repositories/team';
import * as networkRepo from '../../core/repositories/network';
import { exchangeTypes } from '../repositories/dao/exchange';
import { getRequest } from '../../../shared/test-utils/request';
import * as exchangeRepo from '../repositories/exchange';

describe('View users related to exchange', () => {
  describe('Network without integration', () => {
    let network;

    before(async () => {
      network = global.networks.flexAppeal;
    });

    it('should return users for exchange created for network', async () => {
      const exchange = await exchangeRepo.createExchange(global.users.admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.NETWORK,
      });

      const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/users`;
      const { result, statusCode } = await getRequest(endpoint);
      const usersInNetwork = await networkRepo.findUsersForNetwork(network.id);

      assert.equal(statusCode, 200);
      assert.equal(result.data.length, usersInNetwork.length);
      assert.isDefined(result.data[0].function);

      await exchangeRepo.deleteById(exchange.id);
    });

    it('should return correct properties', async () => {
      const exchange = await exchangeRepo.createExchange(global.users.admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.USER,
        values: [global.users.employee.id, global.users.admin.id],
      });

      const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/users`;
      const { result, statusCode } = await getRequest(endpoint);

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

      expectedProperties.forEach(property => assert.property(result.data[0], property));

      await exchangeRepo.deleteById(exchange.id);
    });

    it('should return users for exchange created for user', async () => {
      const exchange = await exchangeRepo.createExchange(global.users.admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.USER,
        values: [global.users.employee.id, global.users.admin.id],
      });

      const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/users`;
      const { result, statusCode } = await getRequest(endpoint);

      assert.equal(statusCode, 200);
      assert.equal(result.data.length, 2);
      assert.isDefined(result.data[0].function);

      await exchangeRepo.deleteById(exchange.id);
    });

    it('should return users for exchange created for team', async () => {
      const team = await teamRepo.create({ networkId: network.id, name: 'Cool Team' });
      await teamRepo.addUserToTeam(team.id, global.users.admin.id);

      const exchange = await exchangeRepo.createExchange(global.users.admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.TEAM,
        values: [team.id],
      });

      const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/users`;
      const { result, statusCode } = await getRequest(endpoint);

      assert.equal(statusCode, 200);
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].id, global.users.admin.id);
      assert.isDefined(result.data[0].function);

      await teamRepo.deleteById(team.id);
      await exchangeRepo.deleteById(exchange.id);
    });
  });
});
