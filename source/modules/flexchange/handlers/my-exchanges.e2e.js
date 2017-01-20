import { assert } from 'chai';
import moment from 'moment';
import qs from 'qs';
import { getRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('My exchanges', () => {
  let network;
  let exchanges;

  before(async () => {
    network = global.networks.flexAppeal;

    const myExchange = createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift created by myself',
    });

    const otherExchange = createExchange(global.users.employee.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift created by someone else',
    });

    const futureExchange = createExchange(global.users.admin.id, network.id, {
      date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift created in future',
    });

    const pastExchange = createExchange(global.users.admin.id, network.id, {
      date: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift created in the past',
    });

    exchanges = await Promise.all([myExchange, otherExchange, futureExchange, pastExchange]);
  });

  after(() => Promise.all(exchanges.map(e => e.destroy())));

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me/exchanges`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.equal(result.data.length, 3);
  });

  it('should return exchanges between given date', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/users/me/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 1);
  });

  it('should return all upcoming exchanges when only the start query param is set', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/users/me/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
  });
});
