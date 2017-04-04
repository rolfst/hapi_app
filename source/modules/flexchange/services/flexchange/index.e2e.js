const { assert } = require('chai');
const R = require('ramda');
const sinon = require('sinon');
const moment = require('moment');
const testHelper = require('../../../../shared/test-utils/helpers');
const dispatcher = require('../../dispatcher');
const exchangeService = require('./index');

describe('Service: Flexchange', () => {
  describe.only('from create to approveExchange', () => {
    let sandbox;
    let admin;
    let creator;
    let acceptor;
    let network;
    let createdExchange1;

    before(async () => {
      sandbox = sinon.sandbox.create();
      sandbox.stub(dispatcher, 'emit').returns(null);

      [admin, creator, acceptor] = await Promise.all([
        testHelper.createUser(),
        testHelper.createUser(),
        testHelper.createUser(),
      ]);
      network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
      await Promise.all([
        testHelper.addUserToNetwork({ networkId: network.id, userId: creator.id }),
        testHelper.addUserToNetwork({ networkId: network.id, userId: acceptor.id }),
      ]);
    });

    after(() => testHelper.cleanAll());

    afterEach(async () => {
      const exchanges = await testHelper.findAllExchanges();
      return Promise.all(R.map(testHelper.deleteExchange, exchanges));
    });

    it('should create a shift', async () => {
      createdExchange1 = await exchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(2, 'hours').toISOString(),
        title: 'Test shift',
        type: 'ALL',
        values: [network.id],
      }, {
        network: { id: network.id },
        credentials: { id: creator.id },
      });

      const expectedCreatedIn = {
        type: 'network',
        id: network.id.toString(),
      };
      const actual = await exchangeService.getExchange(
        { exchangeId: createdExchange1.id }, { credentials: { id: admin.id } });

      // assert.equal(createdExchange1.type, 'exchange');
      // assert.strictEqual(actual.id, createdExchange1.id.toString());
      assert.property(createdExchange1, 'date');
      assert.property(createdExchange1, 'startTime');
      assert.property(createdExchange1, 'endTime');
      assert.equal(createdExchange1.description, null);
      assert.strictEqual(createdExchange1.acceptCount, 0);
      assert.strictEqual(createdExchange1.declineCount, 0);
      // assert.strictEqual(createdExchange1.userId, creator.id);
      assert.equal(createdExchange1.responseStatus, null);
      assert.strictEqual(createdExchange1.isApproved, actual.isApproved);
      // assert.strictEqual(createdExchange1.isApproved, false);
      assert.strictEqual(createdExchange1.createdIn, actual.createdIn);
      // assert.deepEqual(createdExchange1.createdIn, expectedCreatedIn);
      // assert.strictEqual(createdExchange1.user.id, admin.id);
      assert.strictEqual(createdExchange1.approvedUserId, null);
      // assert.strictEqual(createdExchange1.approvedUser, null);
      // assert.deepEqual(createdExchange1.responses, []);
      assert.equal(createdExchange1.title, 'Test shift');
      assert.equal(createdExchange1.networkId, expectedCreatedIn.id);
      assert.property(createdExchange1, 'teamId');
      assert.property(createdExchange1, 'shiftId');
      // assert.property(createdExchange1, 'createdFor');
      assert.equal(createdExchange1.approvedById, null);
      assert.equal(createdExchange1.approvedUserId, null);
      assert.property(createdExchange1, 'Comments');
    });
  });
});
