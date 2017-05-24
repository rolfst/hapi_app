const { assert } = require('chai');
const R = require('ramda');
const sinon = require('sinon');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const Mixpanel = require('../../../shared/services/mixpanel');
const Intercom = require('../../../shared/services/intercom');
const createdNotifier = require('../../flexchange/notifications/exchange-created');
const objectRepo = require('../../core/repositories/object');
const { exchangeTypes } = require('../../flexchange/repositories/dao/exchange');
const exchangeService = require('../../flexchange/services/flexchange');
const exchangeRepo = require('../../flexchange/repositories/exchange');
const unit = require('../remove-shifts');

describe('remove exchanges', () => {
  let sandbox;
  let network;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(createdNotifier, 'send').returns(Promise.resolve(true));
    sandbox.stub(Mixpanel, 'track').returns(Promise.resolve(true));
    sandbox.stub(Intercom, 'createEvent').returns(Promise.resolve(true));
    sandbox.stub(Intercom, 'incrementAttribute').returns(Promise.resolve(true));

    const [admin, employee] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);

    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    await testHelper.addUserToNetwork({ networkId: network.id, userId: employee.id });

    const currentExchanges = R.map(
      (num) => exchangeService.createExchange({
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.NETWORK,
        title: `Test exchange to approve: ${num}`,
        values: [network.id],
      }, {
        network,
        credentials: admin,
      }), R.range(0, 5));
    const outdatedExchanges = R.map(
      (num) => exchangeService.createExchange({
        date: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        type: exchangeTypes.NETWORK,
        title: `Test exchange to approve: ${num}`,
        values: [network.id],
      }, {
        network,
        credentials: admin,
      }), R.range(0, 10));

    await Promise.all(R.concat(currentExchanges, outdatedExchanges));
  });

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

  it('remove objects of outdated exchanges', async () => {
    await unit.run();
    const remainingExchanges = await exchangeRepo.findAllBy();
    const remainingObjects = await objectRepo.findBy();

    assert.equal(remainingExchanges.length, 15);
    assert.equal(remainingObjects.length, 5);
  });
});
