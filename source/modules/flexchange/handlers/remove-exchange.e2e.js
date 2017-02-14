import { assert } from 'chai';
import Promise from 'bluebird';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import { deleteRequest } from '../../../shared/test-utils/request';
import * as activityRepo from '../../core/repositories/activity';
import { exchangeTypes } from '../repositories/dao/exchange';
import * as exchangeService from '../services/flexchange';

describe('Remove exchange', () => {
  let admin;
  let network;
  let exchange;

  before(async () => {
    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    exchange = await exchangeService.createExchange({
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to view',
      description: 'Test description for this cool shift',
    }, { network, credentials: admin });
  });

  after(() => testHelper.cleanAll());

  it('should remove the exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const { result, statusCode } = await deleteRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.success, true);
  });

  it('should remove associated activities', async () => {
    await Promise.delay(1000);
    const activities = await activityRepo.findBy({ sourceId: exchange.id });

    assert.lengthOf(activities, 0);
  });
});
