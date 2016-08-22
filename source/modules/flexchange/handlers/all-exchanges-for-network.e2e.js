import { assert } from 'chai';
import qs from 'qs';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('Get exchanges for network', () => {
  let network;

  before(() => {
    const defaultArgs = {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
    };

    network = global.networks.flexAppeal;

    return network.getExchanges().then(exchanges => {
      return Promise.all(exchanges.map(e => e.destroy()));
    }).then(() => {
      const exchange1 = createExchange(global.users.admin.id, network.id, {
        ...defaultArgs,
        title: 'Test shift 1',
      });

      const exchange2 = createExchange(global.users.admin.id, network.id, {
        ...defaultArgs,
        title: 'Test shift 2',
      });

      const exchange3 = createExchange(global.users.admin.id, network.id, {
        ...defaultArgs,
        date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
        title: 'Test shift 2',
      });

      return Promise.all([exchange1, exchange2, exchange3]);
    });
  });

  it('should return exchanges', async () => {
    const { result, statusCode } = await getRequest(`/v2/networks/${network.id}/exchanges`);

    assert.lengthOf(result.data, 3);
    assert.deepEqual(result.data[0].created_in, { type: 'network', id: network.id });
    assert.equal(result.data[0].user.full_name, global.users.admin.fullName);
    assert.isUndefined(result.data[0].responses);
    assert.equal(statusCode, 200);
  });

  it('should return exchanges with responses', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges?include=responses`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 3);
    assert.isDefined(result.data[0].responses);
    assert.equal(statusCode, 200);
  });

  it('should return exchanges between given date', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 2);
    assert.equal(statusCode, 200);
  });

  it('should return all upcoming exchanges when only the start query param is set', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
    });

    console.log('start of the week', moment().startOf('isoweek').format('YYYY-MM-DD'));

    const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 3);
    assert.equal(statusCode, 200);
  });

  it('should return error when end query param is set without start param', async () => {
    const query = qs.stringify({
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 422);
  });
});
