const { assert } = require('chai');
const Promise = require('bluebird');
const moment = require('moment');
const _ = require('lodash');
const testHelper = require('../../../shared/test-utils/helpers');
const Logger = require('../../../shared/services/logger');
const { getRequest } = require('../../../shared/test-utils/request');
const { ActivityTypes } = require('../../core/repositories/dao/activity');
const exchangeRepo = require('../repositories/exchange');
const commentRepo = require('../repositories/comment');

const logger = Logger.createLogger('FLEXCHANGE/test/exchangeActivityFeed');

describe('Exchange activity feed', () => {
  let admin;
  let employee;
  let network;
  let exchange;
  let result;
  let comment;

  before(async () => {
    [admin, employee] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    exchange = await exchangeRepo.createExchange(employee.id, network.id, {
      type: 'ALL',
      title: 'Activity feed exchange',
      date: moment().format('YYYY-MM-DD'),
    });

    const actions = [
      () => exchangeRepo.acceptExchange(exchange.id, admin.id),
      () => commentRepo.createExchangeComment(
        exchange.id, { text: 'Foo comment', userId: employee.id }
      ),
      () => exchangeRepo.acceptExchange(exchange.id, employee.id),
      () => exchangeRepo.rejectExchange(exchange, admin, employee.id),
      () => exchangeRepo.approveExchange(exchange, admin, admin.id),
    ];

    const values = await Promise.mapSeries(actions, async item => {
      await Promise.delay(1000);
      return item();
    });

    comment = values[1];

    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/activity_feed`;
    const response = await getRequest(endpoint, admin.token);

    logger.debug('@@@@@@@ DEBUG for occasional failure @@@@@@@@', response.result);

    result = response.result.data.map(item => ({
      ...item,
      data: _.omit(item.data, 'date'),
    }));
  });

  after(() => testHelper.cleanAll());

  it('should contain ids as string', () => {
    const actual = result[0];

    assert.isString(actual.data.source_id);
  });

  it('should return correct activity order', () => {
    const actual = result.map(item => item.data.activity_type);
    const expected = [
      ActivityTypes.EXCHANGE_CREATED,
      ActivityTypes.EXCHANGE_ACCEPTED,
      ActivityTypes.EXCHANGE_COMMENT,
      ActivityTypes.EXCHANGE_ACCEPTED,
      ActivityTypes.EXCHANGE_REJECTED,
      ActivityTypes.EXCHANGE_APPROVED,
    ];

    assert.deepEqual(actual, expected);
  });

  it('should contain correct values for type: exchange_created', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_CREATED } });

    assert.isDefined(actual.data.id);
    assert.equal(actual.type, 'activity');
    assert.equal(actual.data.activity_type, ActivityTypes.EXCHANGE_CREATED);
    assert.equal(actual.data.source_id, exchange.id.toString());
    assert.equal(actual.data.user.id, employee.id);
    assert.deepEqual(actual.data.meta_data, { created_in: { type: 'network', id: network.id } });
  });

  it('should contain correct values for type: exchange_accepted', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_ACCEPTED } });

    assert.isDefined(actual.data.id);
    assert.equal(actual.type, 'activity');
    assert.equal(actual.data.activity_type, ActivityTypes.EXCHANGE_ACCEPTED);
    assert.equal(actual.data.source_id, exchange.id.toString());
    assert.equal(actual.data.user.id, admin.id);
    assert.deepEqual(actual.data.meta_data, { });
  });

  it('should contain correct values for type: exchange_comment', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_COMMENT } });

    assert.isDefined(actual.data.id);
    assert.equal(actual.type, 'activity');
    assert.equal(actual.data.activity_type, ActivityTypes.EXCHANGE_COMMENT);
    assert.equal(actual.data.source_id, exchange.id.toString());
    assert.equal(actual.data.user.id, employee.id);
    assert.deepEqual(actual.data.meta_data, { comment_id: comment.id });
  });

  it('should contain correct values for type: exchange_rejected', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_REJECTED } });

    assert.isDefined(actual.data.id);
    assert.equal(actual.type, 'activity');
    assert.equal(actual.data.activity_type, ActivityTypes.EXCHANGE_REJECTED);
    assert.equal(actual.data.source_id, exchange.id.toString());
    assert.equal(actual.data.user.id, admin.id);
    assert.deepEqual(actual.data.meta_data, { rejected_user_id: employee.id });
  });

  it('should contain correct values for type: exchange_approved', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_APPROVED } });

    assert.isDefined(actual.data.id);
    assert.equal(actual.type, 'activity');
    assert.equal(actual.data.activity_type, ActivityTypes.EXCHANGE_APPROVED);
    assert.equal(actual.data.source_id, exchange.id.toString());
    assert.equal(actual.data.user.id, admin.id);
    assert.deepEqual(actual.data.meta_data, { approved_user_id: admin.id });
  });
});
