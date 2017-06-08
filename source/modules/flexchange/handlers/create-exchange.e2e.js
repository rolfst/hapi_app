const { assert } = require('chai');
const sinon = require('sinon');
const R = require('ramda');
const moment = require('moment');
const Promise = require('bluebird');
const testHelper = require('../../../shared/test-utils/helpers');
const stubs = require('../../../shared/test-utils/stubs');
const { postRequest } = require('../../../shared/test-utils/request');
const teamRepo = require('../../core/repositories/team');
const objectService = require('../../core/services/object');
const { exchangeTypes } = require('../repositories/dao/exchange');
const exchangeRepo = require('../repositories/exchange');
const exchangeService = require('../services/flexchange');
const dispatcher = require('../dispatcher');
const Mixpanel = require('../../../shared/services/mixpanel');
const Intercom = require('../../../shared/services/intercom');
const createdNotifier = require('../notifications/exchange-created');

describe('Create exchange', () => {
  let sandbox;
  let admin;
  let employee;
  let flexAppealNetwork;
  let pmtNetwork;
  let flexAppealTeam;
  let otherNetworkTeam;
  const pristineNetwork = stubs.pristine_networks_admins[0];

  let dispatcherEmitSpy;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(Mixpanel, 'track');
    sandbox.stub(createdNotifier, 'send');
    sandbox.stub(Intercom, 'createEvent');
    sandbox.stub(Intercom, 'incrementAttribute');
    dispatcherEmitSpy = sandbox.spy(dispatcher, 'emit');

    admin = await testHelper.createUser();
    employee = await testHelper.createUser();
    flexAppealNetwork = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    const networkWithIntegration = await testHelper.createNetworkWithIntegration(R.merge(
      {
        userId: admin.id,
        token: 'footoken',
      },
      R.pick(['externalId', 'name', 'integrationName'], pristineNetwork)
    ));

    await testHelper.addUserToNetwork({ networkId: flexAppealNetwork.id, userId: employee.id });

    pmtNetwork = networkWithIntegration.network;

    [flexAppealTeam, otherNetworkTeam] = await Promise.all([
      teamRepo.create({ networkId: flexAppealNetwork.id, name: 'Test network' }),
      teamRepo.create({ networkId: pmtNetwork.id, name: 'Test other network' }),
    ]);
  });

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

  it('should create exchange for a network', async () => {
    const endpoint = `/v2/networks/${flexAppealNetwork.id}/exchanges`;
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
    assert.deepEqual(result.data.created_in, { type: 'network', id: flexAppealNetwork.id });
    assert.equal(result.data.title, 'Test shift for network');
    assert.isNotNull(result.data.start_time);
    assert.isNotNull(result.data.end_time);

    return exchangeService.deleteExchange({ exchangeId: result.data.id });
  });

  it('should create an object for the exchange', async () => {
    const endpoint = `/v2/networks/${flexAppealNetwork.id}/exchanges`;
    const { statusCode, result } = await postRequest(endpoint, {
      title: 'Test shift for network',
      date: moment().format('YYYY-MM-DD'),
      description: '',
      type: exchangeTypes.NETWORK,
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    }, admin.token);

    await Promise.delay(1000);

    const userObjects = await objectService.list({
      parentType: 'user',
      parentId: employee.id,
    });
    const createdObject = R.find(R.propEq('sourceId', result.data.id), userObjects);

    assert.equal(statusCode, 200);
    assert.equal(createdObject.userId, admin.id);
    assert.equal(createdObject.objectType, 'exchange');
    assert.equal(createdObject.sourceId, result.data.id);
    assert.equal(createdObject.parentId, employee.id);
    assert.equal(createdObject.parentType, 'user');

    return exchangeService.deleteExchange({ exchangeId: result.data.id });
  });

  it('should create exchange for a team', async () => {
    const endpoint = `/v2/networks/${flexAppealNetwork.id}/exchanges`;
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

    return exchangeService.deleteExchange({ exchangeId: result.data.id });
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

    return exchangeService.deleteExchange({ exchangeId: result.data.id });
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

    return exchangeService.deleteExchange({ exchangeId: result.data.id });
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
    const endpoint = `/v2/networks/${flexAppealNetwork.id}/exchanges`;
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
    const endpoint = `/v2/networks/${flexAppealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id, 20],
    }, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when team_id is defined without defining shift_id', async () => {
    const endpoint = `/v2/networks/${flexAppealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      team_id: flexAppealTeam.id,
    }, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when id\'s don\'t match users in database', async () => {
    const endpoint = `/v2/networks/${flexAppealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.USER,
      values: [Infinity],
    }, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when teams don\'t belong to the network', async () => {
    const endpoint = `/v2/networks/${flexAppealNetwork.id}/exchanges`;
    const { statusCode } = await postRequest(endpoint, {
      title: 'Test shift',
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [flexAppealTeam.id, otherNetworkTeam.id],
    }, admin.token);

    assert.equal(statusCode, 422);
  });

  it('shouldve dispatched with the right properties', async () => {
    assert(dispatcherEmitSpy.called);

    const args = dispatcherEmitSpy.args[0];

    assert.equal(args[0], 'exchange.created');
    assert.isObject(args[1].credentials);
    assert.isObject(args[1].exchange);
    assert.isObject(args[1].network);
  });
});
