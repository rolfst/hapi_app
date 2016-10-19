import { assert } from 'chai';
import moment from 'moment';
import { createNotification } from './creator-approved';

describe('Your exchange approved notification', () => {
  it('should return a correct notification object', () => {
    const futureMoment = moment().add(2, 'weeks');
    const exchange = { id: 1, date: futureMoment.format('YYYY-MM-DD') };
    const approvedUser = { fullName: 'User#1' };
    const actual = createNotification(exchange, approvedUser);

    const expected = {
      text: `Er is een vervanger gevonden voor je shift op ${futureMoment.format('dddd DD MMMM')}`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object', () => {
    const exchange = { id: 1, date: moment().add(1, 'days').format('YYYY-MM-DD') };
    const approvedUser = { fullName: 'User#1' };
    const actual = createNotification(exchange, approvedUser);

    const expected = {
      text: 'Er is een vervanger gevonden voor je shift voor morgen',
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
