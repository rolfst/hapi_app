import { assert } from 'chai';
import moment from 'moment';
import * as exchangeRepository from '../../repositories/exchange';
import * as exchangeService from './index';

describe('Service: Flexchange', () => {
  describe('list', () => {
    let createdExchange1;
    let createdExchange2;

    before(async () => {
      createdExchange1 = await exchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(2, 'hours').toISOString(),
        type: 'ALL',
        values: [global.networks.flexAppeal.id],
      }, {
        network: { id: global.networks.flexAppeal.id },
        credentials: { id: global.users.admin.id },
      });

      createdExchange2 = await exchangeService.createExchange({
        date: moment().toISOString(),
        title: 'Test shift',
        type: 'ALL',
        values: [global.networks.flexAppeal.id],
      }, {
        network: { id: global.networks.flexAppeal.id },
        credentials: { id: global.users.admin.id },
      });
    });

    it('should return correct properties in exchange model', async () => {
      const actual = await exchangeService.list({
        networkId: global.networks.flexAppeal.id,
        exchangeIds: [createdExchange1.id, createdExchange2.id],
      }, {
        credentials: { id: global.users.admin.id },
      });

      const expectedCreatedIn = {
        type: 'network',
        id: global.networks.flexAppeal.id.toString(),
      };

      assert.equal(actual[0].type, 'exchange');
      assert.strictEqual(actual[0].id, createdExchange1.id.toString());
      assert.property(actual[0], 'date');
      assert.property(actual[0], 'startTime');
      assert.property(actual[0], 'endTime');
      assert.equal(actual[0].description, null);
      assert.strictEqual(actual[0].acceptCount, 0);
      assert.strictEqual(actual[0].declineCount, 0);
      assert.strictEqual(actual[0].userId, global.users.admin.id);
      assert.equal(actual[0].responseStatus, null);
      assert.strictEqual(actual[0].isApproved, false);
      assert.deepEqual(actual[0].createdIn, expectedCreatedIn);
      assert.strictEqual(actual[0].user.id, global.users.admin.id);
      assert.strictEqual(actual[0].approvedUserId, null);
      assert.strictEqual(actual[0].approvedUser, null);
      assert.deepEqual(actual[0].responses, []);
      assert.equal(actual[1].title, 'Test shift');
    });

    describe('Response statusses', () => {
      it('should show correct responses for ACCEPTED', async () => {
        await exchangeRepository.acceptExchange(createdExchange1.id, global.users.admin.id);

        const actual = await exchangeService.list({
          networkId: global.networks.flexAppeal.id,
          exchangeIds: [createdExchange1.id],
        }, {
          credentials: { id: global.users.admin.id },
        });

        const actualResponse = actual[0].responses[0];

        assert.equal(actual[0].responseStatus, 'ACCEPTED');
        assert.lengthOf(actual[0].responses, 1);
        assert.strictEqual(actual[0].approvedUserId, null);
        assert.strictEqual(actual[0].approvedUser, null);
        assert.equal(actualResponse.type, 'exchange_response');
        assert.strictEqual(actualResponse.userId, global.users.admin.id);
        assert.isTrue(actualResponse.response);
        assert.isNull(actualResponse.isApproved);
        assert.property(actualResponse, 'createdAt');
        assert.strictEqual(actualResponse.user.id, global.users.admin.id);
      });

      it('should show correct responses for DECLINED', async () => {
        await exchangeRepository.declineExchange(createdExchange1.id, global.users.admin.id);

        const actual = await exchangeService.list({
          networkId: global.networks.flexAppeal.id,
          exchangeIds: [createdExchange1.id],
        }, {
          credentials: { id: global.users.admin.id },
        });

        const actualResponse = actual[0].responses[0];

        assert.equal(actual[0].responseStatus, 'DECLINED');
        assert.lengthOf(actual[0].responses, 1);
        assert.strictEqual(actual[0].approvedUserId, null);
        assert.strictEqual(actual[0].approvedUser, null);
        assert.equal(actualResponse.type, 'exchange_response');
        assert.strictEqual(actualResponse.userId, global.users.admin.id);
        assert.isFalse(actualResponse.response);
        assert.isNull(actualResponse.isApproved);
        assert.property(actualResponse, 'createdAt');
        assert.strictEqual(actualResponse.user.id, global.users.admin.id);
      });

      it('should show correct responses for REJECTED', async () => {
        await exchangeRepository.acceptExchange(createdExchange1.id, global.users.admin.id);
        await exchangeRepository.rejectExchange(
          createdExchange1, global.users.admin, global.users.admin.id);

        const actual = await exchangeService.list({
          networkId: global.networks.flexAppeal.id,
          exchangeIds: [createdExchange1.id],
        }, {
          credentials: { id: global.users.admin.id },
        });

        const actualResponse = actual[0].responses[0];

        assert.equal(actual[0].responseStatus, 'REJECTED');
        assert.lengthOf(actual[0].responses, 1);
        assert.equal(actualResponse.type, 'exchange_response');
        assert.strictEqual(actualResponse.userId, global.users.admin.id);
        assert.isTrue(actualResponse.response);
        assert.isFalse(actualResponse.isApproved);
        assert.property(actualResponse, 'createdAt');
        assert.strictEqual(actual[0].approvedUserId, null);
        assert.strictEqual(actual[0].approvedUser, null);
        assert.strictEqual(actualResponse.user.id, global.users.admin.id);
      });

      it('should show correct responses for APPROVED', async () => {
        await exchangeRepository.acceptExchange(createdExchange1.id, global.users.admin.id);
        await exchangeRepository.approveExchange(
          createdExchange1, global.users.admin, global.users.admin.id);

        const actual = await exchangeService.list({
          networkId: global.networks.flexAppeal.id,
          exchangeIds: [createdExchange1.id],
        }, {
          credentials: { id: global.users.admin.id },
        });

        const actualResponse = actual[0].responses[0];

        assert.equal(actual[0].responseStatus, 'APPROVED');
        assert.lengthOf(actual[0].responses, 1);
        assert.equal(actualResponse.type, 'exchange_response');
        assert.strictEqual(actualResponse.userId, global.users.admin.id);
        assert.isTrue(actualResponse.response);
        assert.isTrue(actualResponse.isApproved);
        assert.property(actualResponse, 'createdAt');
        assert.strictEqual(actual[0].approvedUserId, global.users.admin.id);
        assert.strictEqual(actual[0].approvedUser.id, global.users.admin.id);
        assert.strictEqual(actualResponse.user.id, global.users.admin.id);
      });
    });
  });
});
