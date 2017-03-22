const { assert } = require('chai');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const { exchangeTypes } = require('../repositories/dao/exchange');
const { getRequest } = require('../../../shared/test-utils/request');
const { createExchange } = require('../repositories/exchange');
const { create } = require('../../core/repositories/team');

describe('View exchange', () => {
  let admin;
  let network;
  let exchange;

  before(async () => {
    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    exchange = await createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to view',
      description: 'Test description for this cool shift',
    });
  });

  after(() => testHelper.cleanAll());

  it('should return correct attributes', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const { result } = await getRequest(endpoint, admin.token);
    console.log('%%%%%%%%%%%result', result);

    assert.equal(result.data.user.fullName, admin.full_name);
    assert.equal(result.data.title, 'Test shift to view');
    assert.equal(result.data.vote_result, null);
    assert.deepEqual(result.data.created_in, { type: 'network', id: network.id.toString() });
    assert.equal(result.data.description, 'Test description for this cool shift');
  });

  it('should return correct attributes for exchange from external shift', async () => {
    const team = await create({ networkId: network.id, name: 'Test network' });
    const externalShiftExchange = await createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      shiftId: 1,
      teamId: team.id,
      values: [admin.id],
    });

    const endpoint = `/v2/networks/${network.id}/exchanges/${externalShiftExchange.id}`;
    const { result } = await getRequest(endpoint, admin.token);

    assert.deepEqual(result.data.created_in, { type: 'team', ids: [team.id.toString()] });
  });

  it('should return created in network when exchange is created for user', async () => {
    const exchangeForUser = await createExchange(admin.id, network.id, {
      type: exchangeTypes.USER,
      values: [admin.id],
      date: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
      title: 'Test shift in past',
    });

    const endpoint = `/v2/networks/${network.id}/exchanges/${exchangeForUser.id}`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.deepEqual(result.data.created_in, { type: 'network', id: network.id });
  });

  it('should fail when exchange cannot be found', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id + 1337}`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 404);
  });
});
