import { assert } from 'chai';
import moment from 'moment';
import { getRequest, postRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';
import { createTeam } from 'common/repositories/team';

let exchange;
let flexAppealTeam;
let otherNetworkTeam;

describe('Create exchange', () => {
  before(async () => {
    exchange = await createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift for network',
    });

    flexAppealTeam = await createTeam(global.networks.flexAppeal.id, 'Test network', '');
    otherNetworkTeam = await createTeam(32, 'Test network', '');
  });

  after(() => {
    flexAppealTeam.destroy();
    otherNetworkTeam.destroy();
  });

  it('should return exchange data', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`;
    const { statusCode, result } = await getRequest(endpoint);

    assert.equal(result.data.title, 'Test shift for network');
    assert.equal(statusCode, 200);
  });

  it('should fail when id\'s don\'t match users in database', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges`;
    const { admin } = global.users;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: 'USER',
      values: JSON.stringify([admin.id, 2]),
    });

    assert.equal(statusCode, 422);
  });

  it('should fail when user don\'t belong to the network', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges`;
    const { admin, networklessUser } = global.users;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: 'USER',
      values: JSON.stringify([admin.id, networklessUser.id]),
    });

    assert.equal(statusCode, 422);
  });

  it('should fail when id\'s don\'t match teams in database', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: 'TEAM',
      values: JSON.stringify([flexAppealTeam.id, '20']),
    });

    assert.equal(statusCode, 422);
  });

  it('should fail when teams don\'t belong to the network', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: 'TEAM',
      values: JSON.stringify([flexAppealTeam.id, otherNetworkTeam.id]),
    });

    assert.equal(statusCode, 422);
  });
});
