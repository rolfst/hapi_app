const { assert } = require('chai');
const sinon = require('sinon');
const moment = require('moment');
const testHelper = require('../../../../shared/test-utils/helpers');
const notifier = require('../../../../shared/services/notifier');
const exchangeRepository = require('../../repositories/exchange');
const exchangeService = require('./index');

describe('Service: Flexchange', () => {
  describe('list', () => {
    let sandbox;
    let admin;
    let network;
    let createdExchange1;
    let createdExchange2;

    before(async () => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(notifier, 'send').returns(null);

      admin = await testHelper.createUser();
      network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

      createdExchange1 = await exchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(2, 'hours').toISOString(),
        type: 'ALL',
        values: [network.id],
      }, {
        network: { id: network.id },
        credentials: { id: admin.id },
      });

      createdExchange2 = await exchangeService.createExchange({
        date: moment().toISOString(),
        title: 'Test shift',
        type: 'ALL',
        values: [network.id],
      }, {
        network: { id: network.id },
        credentials: { id: admin.id },
      });
    });

    after(() => {
      sandbox.restore();
      return testHelper.cleanAll();
    });

    it('should return correct properties in exchange model', async () => {
      const actual = await exchangeService.list({
        exchangeIds: [createdExchange1.id, createdExchange2.id],
      }, {
        network: { id: network.id },
        credentials: { id: admin.id },
      });

      const expectedCreatedIn = {
        type: 'network',
        id: network.id.toString(),
      };

      assert.equal(actual[0].type, 'exchange');
      assert.strictEqual(actual[0].id, createdExchange1.id.toString());
      assert.property(actual[0], 'date');
      assert.property(actual[0], 'startTime');
      assert.property(actual[0], 'endTime');
      assert.equal(actual[0].description, null);
      assert.strictEqual(actual[0].acceptCount, 0);
      assert.strictEqual(actual[0].declineCount, 0);
      assert.strictEqual(actual[0].userId, admin.id);
      assert.equal(actual[0].responseStatus, null);
      assert.strictEqual(actual[0].isApproved, false);
      assert.deepEqual(actual[0].createdIn, expectedCreatedIn);
      assert.strictEqual(actual[0].user.id, admin.id);
      assert.strictEqual(actual[0].approvedUserId, null);
      assert.strictEqual(actual[0].approvedUser, null);
      assert.deepEqual(actual[0].responses, []);
      assert.equal(actual[1].title, 'Test shift');
      assert.equal(actual[0].networkId, expectedCreatedIn.id);
      assert.property(actual[0], 'teamId');
      assert.property(actual[0], 'shiftId');
      assert.property(actual[0], 'createdFor');
      assert.equal(actual[0].approvedById, null);
      assert.equal(actual[0].approvedUserId, null);
    });

    describe('Response statusses', () => {
      it('should show correct responses for ACCEPTED', async () => {
        await exchangeRepository.acceptExchange(createdExchange1.id, admin.id);

        const actual = await exchangeService.list({
          exchangeIds: [createdExchange1.id],
        }, {
          network: { id: network.id },
          credentials: { id: admin.id },
        });

        const actualResponse = actual[0].responses[0];

        assert.equal(actual[0].responseStatus, 'ACCEPTED');
        assert.lengthOf(actual[0].responses, 1);
        assert.strictEqual(actual[0].approvedUserId, null);
        assert.strictEqual(actual[0].approvedUser, null);
        assert.equal(actualResponse.type, 'exchange_response');
        assert.strictEqual(actualResponse.userId, admin.id);
        assert.isTrue(actualResponse.response);
        assert.isNull(actualResponse.isApproved);
        assert.property(actualResponse, 'createdAt');
        assert.strictEqual(actualResponse.user.id, admin.id);
      });

      it('should show correct responses for DECLINED', async () => {
        await exchangeRepository.declineExchange(createdExchange1.id, admin.id);

        const actual = await exchangeService.list({
          exchangeIds: [createdExchange1.id],
        }, {
          network: { id: network.id },
          credentials: { id: admin.id },
        });

        const actualResponse = actual[0].responses[0];

        assert.equal(actual[0].responseStatus, 'DECLINED');
        assert.lengthOf(actual[0].responses, 1);
        assert.strictEqual(actual[0].approvedUserId, null);
        assert.strictEqual(actual[0].approvedUser, null);
        assert.equal(actualResponse.type, 'exchange_response');
        assert.strictEqual(actualResponse.userId, admin.id);
        assert.isFalse(actualResponse.response);
        assert.isNull(actualResponse.isApproved);
        assert.property(actualResponse, 'createdAt');
        assert.strictEqual(actualResponse.user.id, admin.id);
      });

      it('should show correct responses for REJECTED', async () => {
        await exchangeRepository.acceptExchange(createdExchange1.id, admin.id);
        await exchangeRepository.rejectExchange(
          createdExchange1, admin, admin.id);

        const actual = await exchangeService.list({
          exchangeIds: [createdExchange1.id],
        }, {
          network: { id: network.id },
          credentials: { id: admin.id },
        });

        const actualResponse = actual[0].responses[0];

        assert.equal(actual[0].responseStatus, 'REJECTED');
        assert.lengthOf(actual[0].responses, 1);
        assert.equal(actualResponse.type, 'exchange_response');
        assert.strictEqual(actualResponse.userId, admin.id);
        assert.isTrue(actualResponse.response);
        assert.isFalse(actualResponse.isApproved);
        assert.property(actualResponse, 'createdAt');
        assert.strictEqual(actual[0].approvedUserId, null);
        assert.strictEqual(actual[0].approvedUser, null);
        assert.strictEqual(actualResponse.user.id, admin.id);
      });

      it('should show correct responses for APPROVED', async () => {
        await exchangeRepository.acceptExchange(createdExchange1.id, admin.id);
        await exchangeRepository.approveExchange(
          createdExchange1, admin, admin.id);

        const actual = await exchangeService.list({
          exchangeIds: [createdExchange1.id],
        }, {
          network: { id: network.id },
          credentials: { id: admin.id },
        });

        const actualResponse = actual[0].responses[0];

        assert.equal(actual[0].responseStatus, 'APPROVED');
        assert.lengthOf(actual[0].responses, 1);
        assert.equal(actualResponse.type, 'exchange_response');
        assert.strictEqual(actualResponse.userId, admin.id);
        assert.isTrue(actualResponse.response);
        assert.isTrue(actualResponse.isApproved);
        assert.property(actualResponse, 'createdAt');
        assert.strictEqual(actual[0].approvedUserId, admin.id);
        assert.strictEqual(actual[0].approvedUser.id, admin.id);
        assert.strictEqual(actualResponse.user.id, admin.id);
      });
    });
  });
});
