import { assert } from 'chai';
import moment from 'moment';
import qs from 'qs';
import * as testHelper from '../../../shared/test-utils/helpers';
import { getRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('My exchanges', () => {
  let admin;
  let network;

  before(async () => {
    const [user, employee] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    admin = user;
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    const myExchange = createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift created by myself',
    });

    const otherExchange = createExchange(employee.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift created by someone else',
    });

    const futureExchange = createExchange(admin.id, network.id, {
      date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift created in future',
    });

    const pastExchange = createExchange(admin.id, network.id, {
      date: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift created in the past',
    });

    return Promise.all([myExchange, otherExchange, futureExchange, pastExchange]);
  });

  after(() => testHelper.cleanAll());

  it('should return correct data', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me/exchanges`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.length, 3);
  });

  it('should return exchanges between given date', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/users/me/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 1);
  });

  it('should return all upcoming exchanges when only the start query param is set', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/users/me/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
  });
});
