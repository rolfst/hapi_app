import { assert } from 'chai';
import Promise from 'bluebird';
import moment from 'moment';
import _ from 'lodash';
import { ActivityTypes } from 'shared/models/activity';
import { getRequest } from 'shared/test-utils/request';
import {
  createExchange,
  acceptExchange,
  rejectExchange,
  approveExchange,
} from 'modules/flexchange/repositories/exchange';
import { createExchangeComment } from 'modules/flexchange/repositories/comment';

let network;
let exchange;
let result;
let comment;

describe('Exchange activity feed', () => {
  before(async () => {
    const { admin, employee } = global.users;
    network = global.networks.flexAppeal;

    exchange = await createExchange(employee.id, network.id, {
      type: 'ALL',
      title: 'Activity feed exchange',
      date: moment().format('YYYY-MM-DD'),
    });

    const actions = [
      () => acceptExchange(exchange.id, admin.id),
      () => createExchangeComment(
        exchange.id, { text: 'Foo comment', userId: employee.id }
      ),
      () => acceptExchange(exchange.id, employee.id),
      () => rejectExchange(exchange, admin, employee.id),
      () => approveExchange(exchange, admin, admin.id),
    ];

    const values = await Promise.mapSeries(actions, async item => {
      await Promise.delay(1000);
      return item();
    });

    comment = values[1];

    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/activity_feed`;
    const response = await getRequest(endpoint);

    result = response.result.data.map(item => ({
      ...item,
      data: _.omit(item.data, 'date'),
    }));
  });

  after(() => exchange.destroy());

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
    const expected = {
      type: 'activity',
      data: {
        activity_type: ActivityTypes.EXCHANGE_CREATED,
        source_id: exchange.id.toString(),
        user: global.users.employee.toSimpleJSON(),
        meta_data: {
          created_in: { type: 'network', id: network.id },
        },
      },
    };

    assert.deepEqual(actual, expected);
  });

  it('should contain correct values for type: exchange_accepted', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_ACCEPTED } });
    const expected = {
      type: 'activity',
      data: {
        activity_type: ActivityTypes.EXCHANGE_ACCEPTED,
        source_id: exchange.id.toString(),
        user: global.users.admin.toSimpleJSON(),
        meta_data: {},
      },
    };

    assert.deepEqual(actual, expected);
  });

  it('should contain correct values for type: exchange_comment', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_COMMENT } });
    const expected = {
      type: 'activity',
      data: {
        activity_type: ActivityTypes.EXCHANGE_COMMENT,
        source_id: exchange.id.toString(),
        user: global.users.employee.toSimpleJSON(),
        meta_data: {
          comment_id: comment.id,
        },
      },
    };

    assert.deepEqual(actual, expected);
  });

  it('should contain correct values for type: exchange_rejected', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_REJECTED } });
    const expected = {
      type: 'activity',
      data: {
        activity_type: ActivityTypes.EXCHANGE_REJECTED,
        source_id: exchange.id.toString(),
        user: global.users.admin.toSimpleJSON(),
        meta_data: {
          rejected_user_id: global.users.employee.id,
        },
      },
    };

    assert.deepEqual(actual, expected);
  });

  it('should contain correct values for type: exchange_approved', () => {
    const actual = _.find(result, { data: { activity_type: ActivityTypes.EXCHANGE_APPROVED } });
    const expected = {
      type: 'activity',
      data: {
        activity_type: ActivityTypes.EXCHANGE_APPROVED,
        source_id: exchange.id.toString(),
        user: global.users.admin.toSimpleJSON(),
        meta_data: {
          approved_user_id: global.users.admin.id,
        },
      },
    };

    assert.deepEqual(actual, expected);
  });
});