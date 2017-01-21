import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from '../repositories/dao/exchange';
import { getRequest } from '../../../shared/test-utils/request';
import { createExchange } from '../repositories/exchange';
import { createTeam } from '../../core/repositories/team';

describe('View exchange', () => {
  let network;
  let exchange;

  before(async () => {
    network = global.networks.flexAppeal;

    exchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to view',
      description: 'Test description for this cool shift',
    });
  });

  after(() => exchange.destroy());

  it('should return correct attributes', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const { result } = await getRequest(endpoint);

    assert.equal(result.data.user.fullName, global.users.admin.full_name);
    assert.equal(result.data.title, 'Test shift to view');
    assert.equal(result.data.vote_result, null);
    assert.deepEqual(result.data.created_in, { type: 'network', id: network.id.toString() });
    assert.equal(result.data.description, 'Test description for this cool shift');
  });

  it('should return correct attributes for exchange from external shift', async () => {
    const team = await createTeam({ networkId: network.id, name: 'Test network' });
    const externalShiftExchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      shiftId: 1,
      teamId: team.id,
      values: [global.users.admin.id],
    });

    const endpoint = `/v2/networks/${network.id}/exchanges/${externalShiftExchange.id}`;
    const { result } = await getRequest(endpoint);

    assert.deepEqual(result.data.created_in, { type: 'team', ids: [team.id.toString()] });
  });

  it('should return created in network when exchange is created for user', async () => {
    const exchangeForUser = await createExchange(global.users.admin.id, network.id, {
      type: exchangeTypes.USER,
      values: [global.users.admin.id],
      date: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
      title: 'Test shift in past',
    });

    const endpoint = `/v2/networks/${network.id}/exchanges/${exchangeForUser.id}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.deepEqual(result.data.created_in, { type: 'network', id: network.id });
  });

  it('should fail when exchange cannot be found', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id + 1337}`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 404);
  });
});
