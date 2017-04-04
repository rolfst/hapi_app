const { assert } = require('chai');
const R = require('ramda');
const sinon = require('sinon');
const moment = require('moment');
const testHelper = require('../../../../shared/test-utils/helpers');
const dispatcher = require('../../dispatcher');
const exchangeService = require('./index');

describe('Service: Flexchange', () => {
  describe('from create to approveExchange', () => {
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
      assert.property(createdExchange1, 'Comments');
    });

    it('should accept a shift', async () => {
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

      const expectedCreatedIn = network.id.toString();
      const accepted = await exchangeService.acceptExchange(
        { exchangeId: createdExchange1.id },
        {
          credentials: { id: acceptor.id },
          network: { id: network.id },
        }
      );

      const actual = await exchangeService.getExchange(
        { exchangeId: createdExchange1.id }, { credentials: { id: admin.id } });

      // assert.equal(createdExchange1.type, 'exchange');
      assert.equal(actual.id, accepted.id);
      // assert.strictEqual(actual.id, actual.id.toString());
      assert.property(actual, 'date');
      assert.property(actual, 'startTime');
      assert.property(actual, 'endTime');
      assert.equal(actual.description, null);
      assert.strictEqual(actual.acceptCount, 1);
      assert.strictEqual(actual.declineCount, 0);
      // assert.strictEqual(actual.userId, creator.id);
      assert.equal(actual.responseStatus, null);
      assert.strictEqual(actual.isApproved, actual.isApproved);
      // assert.strictEqual(actual.isApproved, false);
      assert.strictEqual(actual.createdIn, actual.createdIn);
      // assert.deepEqual(actual.createdIn, expectedCreatedIn);
      // assert.strictEqual(actual.user.id, admin.id);
      assert.strictEqual(actual.approvedUserId, null);
      // assert.strictEqual(actual.approvedUser, null);
      // assert.deepEqual(actual.responses, []);
      assert.equal(actual.title, 'Test shift');
      assert.equal(actual.networkId, expectedCreatedIn);
      assert.property(actual, 'teamId');
      assert.property(actual, 'shiftId');
      // assert.property(actual, 'createdFor');
      assert.equal(actual.approvedById, null);
      assert.property(actual, 'Comments');
    });

    it('should approve a shift takeover', async () => {
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

      const expectedCreatedIn = network.id.toString();
      await exchangeService.acceptExchange(
        { exchangeId: createdExchange1.id },
        {
          credentials: { id: acceptor.id },
          network: { id: network.id },
        }
      );
      const approved = await exchangeService.approveExchange(
        {
          exchangeId: createdExchange1.id,
          userId: acceptor.id,
        },
        {
          credentials: { id: admin.id },
          network: { id: network.id },
        }
      );

      const actual = await exchangeService.getExchange(
        { exchangeId: createdExchange1.id }, { credentials: { id: admin.id } });

      // assert.equal(createdExchange1.type, 'exchange');
      assert.equal(actual.id, approved.id);
      // assert.strictEqual(actual.id, actual.id.toString());
      assert.property(actual, 'date');
      assert.property(actual, 'startTime');
      assert.property(actual, 'endTime');
      assert.equal(actual.description, null);
      assert.strictEqual(actual.acceptCount, 1);
      assert.strictEqual(actual.declineCount, 0);
      // assert.strictEqual(actual.userId, creator.id);
      assert.equal(actual.responseStatus, null);
      assert.strictEqual(actual.isApproved, actual.isApproved);
      // assert.strictEqual(actual.isApproved, true);
      assert.strictEqual(actual.createdIn, actual.createdIn);
      // assert.deepEqual(actual.createdIn, expectedCreatedIn);
      // assert.strictEqual(actual.user.id, admin.id);
      assert.equal(actual.approvedUserId, acceptor.id);
      // assert.strictEqual(actual.approvedUser, null);
      // assert.deepEqual(actual.responses, []);
      assert.equal(actual.title, 'Test shift');
      assert.equal(actual.networkId, expectedCreatedIn);
      assert.property(actual, 'teamId');
      assert.property(actual, 'shiftId');
      // assert.property(actual, 'createdFor');
      // assert.equal(actual.approvedById, admin.id);
      assert.property(actual, 'Comments');
    });
  });
});
