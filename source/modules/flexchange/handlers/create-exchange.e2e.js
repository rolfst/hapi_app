import { assert } from 'chai';
import moment from 'moment';
import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { postRequest } from 'common/test-utils/request';
import { createTeam } from 'common/repositories/team';

let network;
let flexAppealTeam;
let otherNetworkTeam;

describe('Create exchange', () => {
  before(async () => {
    network = global.networks.flexAppeal;
    flexAppealTeam = await createTeam(network.id, 'Test network', '');
    otherNetworkTeam = await createTeam(32, 'Test network', '');
  });

  after(() => {
    flexAppealTeam.destroy();
    otherNetworkTeam.destroy();
  });

  it('should create exchange for a network', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode, result } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
    });

    assert.equal(result.data.user.fullName, global.users.admin.full_name);
    assert.deepEqual(result.data.created_in, { type: 'network', id: network.id });
    assert.equal(result.data.title, 'Test shift for network');
    assert.equal(statusCode, 200);
  });

  it('should create exchange for a team', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode, result } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id],
    });

    assert.equal(result.data.user.fullName, global.users.admin.full_name);
    assert.deepEqual(result.data.created_in, { type: 'team', ids: [flexAppealTeam.id] });
    assert.equal(result.data.title, 'Test shift for network');
    assert.equal(statusCode, 200);
  });

  it('should create exchange with external shift id', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/exchanges`;
    const { result } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      shift_id: 1,
    });

    const actual = await findExchangeById(result.data.id);

    assert.equal(actual.shiftId, 1);
  });

  it('should fail for exchange with external shift id in network without integration', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      shift_id: 1,
    });

    assert.equal(statusCode, 403);
  });

  it('should fail when id\'s don\'t match teams in database', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id, 20],
    });

    assert.equal(statusCode, 422);
  });

  it('should fail when teams don\'t belong to the network', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id, otherNetworkTeam.id],
    });

    assert.equal(statusCode, 422);
  });
});
