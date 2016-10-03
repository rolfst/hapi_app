import { assert } from 'chai';
import moment from 'moment';
import { findExchangeById, deleteExchangeById } from 'modules/flexchange/repositories/exchange';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { postRequest } from 'shared/test-utils/request';
import { createTeam } from 'shared/repositories/team';

let network;
let flexAppealTeam;
let otherNetworkTeam;

describe('Create exchange', () => {
  before(async () => {
    network = global.networks.flexAppeal;

    [flexAppealTeam, otherNetworkTeam] = await Promise.all([
      createTeam({ networkId: network.id, name: 'Test network' }),
      createTeam({ networkId: 32, name: 'Test network' }),
    ]);
  });

  after(() => Promise.all([flexAppealTeam.destroy(), otherNetworkTeam.destroy()]));

  it('should create exchange for a network', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode, result } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      description: '',
      type: exchangeTypes.NETWORK,
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    });

    assert.equal(statusCode, 200);
    assert.equal(result.data.user.fullName, global.users.admin.full_name);
    assert.deepEqual(result.data.created_in, { type: 'network', id: network.id });
    assert.equal(result.data.title, 'Test shift for network');
    assert.isNotNull(result.data.start_time);
    assert.isNotNull(result.data.end_time);

    return deleteExchangeById(result.data.id);
  });

  it('should create exchange for a team', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode, result } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id],
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    });

    assert.equal(statusCode, 200);
    assert.equal(result.data.user.fullName, global.users.admin.full_name);
    assert.deepEqual(result.data.created_in, { type: 'team', ids: [flexAppealTeam.id] });
    assert.equal(result.data.title, 'Test shift for network');
    assert.isNotNull(result.data.start_time);
    assert.isNotNull(result.data.end_time);

    return deleteExchangeById(result.data.id);
  });

  it('should create exchange for external shift', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/exchanges`;
    const { result } = await postRequest(endpoint, {
      shift_id: 1,
      team_id: flexAppealTeam.id,
      type: exchangeTypes.USER,
      date: moment().format('YYYY-MM-DD'),
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
      values: [global.users.admin.id],
    });

    const actual = await findExchangeById(result.data.id);

    assert.equal(actual.shiftId, 1);
    assert.equal(actual.type, 'USER');
    assert.equal(actual.teamId, flexAppealTeam.id);
    assert.equal(actual.ExchangeValues[0].value, global.users.admin.id);

    return deleteExchangeById(result.data.id);
  });

  it('should create exchange with begin and end-time', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/exchanges`;
    const payload = {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    };

    const { result } = await postRequest(endpoint, payload);

    assert.isTrue(moment(result.data.start_time).isSame(payload.start_time, 'minute'));
    assert.isTrue(moment(result.data.end_time).isSame(payload.end_time, 'minute'));

    return deleteExchangeById(result.data.id);
  });

  it('should fail when end_time is before start_time', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/exchanges`;
    const payload = {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      start_time: moment().toISOString(),
      end_time: moment().subtract(2, 'hours').toISOString(),
    };

    const { statusCode } = await postRequest(endpoint, payload);

    assert.equal(statusCode, 422);
  });

  it('should fail when end_time is defined without defining start_time', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/exchanges`;
    const payload = {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      end_time: moment().add(2, 'hours').toISOString(),
    };

    const { statusCode } = await postRequest(endpoint, payload);

    assert.equal(statusCode, 422);
  });

  it('should fail for exchange with external shift id in network without integration', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      shift_id: 1,
      team_id: flexAppealTeam.id,
      values: [global.users.admin.id],
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
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

  it('should fail when team_id is defined without defining shift_id', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      team_id: flexAppealTeam.id,
    });

    assert.equal(statusCode, 422);
  });

  it('should fail when id\'s don\'t match users in database', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      values: [Infinity],
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
