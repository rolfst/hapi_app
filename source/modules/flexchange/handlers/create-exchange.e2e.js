import { assert } from 'chai';
import sinon from 'sinon';
import { pick } from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as stubs from '../../../shared/test-utils/stubs';
import * as notifier from '../../../shared/services/notifier';
import { postRequest } from '../../../shared/test-utils/request';
import * as teamRepo from '../../core/repositories/team';
import { exchangeTypes } from '../repositories/dao/exchange';
import * as exchangeRepo from '../repositories/exchange';

describe('Create exchange', () => {
  let sandbox;
  let admin;
  let flexappealNetwork;
  let pmtNetwork;
  let flexAppealTeam;
  let otherNetworkTeam;
  const pristineNetwork = stubs.pristine_networks_admins[0];

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(notifier, 'send').returns(null);

    admin = await testHelper.createUser();
    flexappealNetwork = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    const { network } = await testHelper.createNetworkWithIntegration({
      userId: admin.id,
      token: 'footoken',
      ...pick(pristineNetwork, 'externalId', 'name', 'integrationName'),
    });
    pmtNetwork = network;

    [flexAppealTeam, otherNetworkTeam] = await Promise.all([
      teamRepo.create({ networkId: flexappealNetwork.id, name: 'Test network' }),
      teamRepo.create({ networkId: pmtNetwork.id, name: 'Test other network' }),
    ]);
  });

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

  it('should create exchange for a network', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/exchanges`;
    const { statusCode, result } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      description: '',
      type: exchangeTypes.NETWORK,
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    }, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.user.fullName, admin.full_name);
    assert.deepEqual(result.data.created_in, { type: 'network', id: flexappealNetwork.id });
    assert.equal(result.data.title, 'Test shift for network');
    assert.isNotNull(result.data.start_time);
    assert.isNotNull(result.data.end_time);

    return exchangeRepo.deleteById(result.data.id);
  });

  it('should create exchange for a team', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/exchanges`;
    const { statusCode, result } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id],
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    }, admin.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.user.fullName, admin.full_name);
    assert.deepEqual(result.data.created_in, { type: 'team', ids: [flexAppealTeam.id.toString()] });
    assert.equal(result.data.title, 'Test shift for network');
    assert.isNotNull(result.data.start_time);
    assert.isNotNull(result.data.end_time);

    return exchangeRepo.deleteById(result.data.id);
  });

  it('should create exchange for external shift', async () => {
    const endpoint = `/v2/networks/${pmtNetwork.id}/exchanges`;
    const { result } = await postRequest(endpoint, {
      shift_id: 1,
      team_id: flexAppealTeam.id,
      type: exchangeTypes.USER,
      date: moment().format('YYYY-MM-DD'),
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
      values: [admin.id],
    }, admin.token);

    const actual = await exchangeRepo.findExchangeById(result.data.id);

    assert.equal(actual.shiftId, 1);
    assert.equal(actual.type, 'USER');
    assert.equal(actual.teamId, flexAppealTeam.id);
    assert.equal(actual.ExchangeValues[0].value, admin.id);

    return exchangeRepo.deleteById(result.data.id);
  });

  it('should create exchange with begin and end-time', async () => {
    const endpoint = `/v2/networks/${pmtNetwork.id}/exchanges`;
    const payload = {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    };

    const { result } = await postRequest(endpoint, payload, admin.token);

    assert.isTrue(moment(result.data.start_time).isSame(payload.start_time, 'minute'));
    assert.isTrue(moment(result.data.end_time).isSame(payload.end_time, 'minute'));

    return exchangeRepo.deleteById(result.data.id);
  });

  it('should fail when end_time is before start_time', async () => {
    const endpoint = `/v2/networks/${pmtNetwork.id}/exchanges`;
    const payload = {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      start_time: moment().toISOString(),
      end_time: moment().subtract(2, 'hours').toISOString(),
    };

    const { statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when end_time is defined without defining start_time', async () => {
    const endpoint = `/v2/networks/${pmtNetwork.id}/exchanges`;
    const payload = {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      end_time: moment().add(2, 'hours').toISOString(),
    };

    const { statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail for exchange with external shift id in network without integration', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      shift_id: 1,
      team_id: flexAppealTeam.id,
      values: [admin.id],
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    }, admin.token);

    assert.equal(statusCode, 403);
  });

  it('should fail when id\'s don\'t match teams in database', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id, 20],
    }, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when team_id is defined without defining shift_id', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      team_id: flexAppealTeam.id,
    }, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when id\'s don\'t match users in database', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      values: [Infinity],
    }, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when teams don\'t belong to the network', async () => {
    const endpoint = `/v2/networks/${flexappealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id, otherNetworkTeam.id],
    }, admin.token);

    assert.equal(statusCode, 422);
  });
});
