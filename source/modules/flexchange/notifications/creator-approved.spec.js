import { assert } from 'chai';
import { createNotification } from './creator-approved';

describe('Your exchange approved notification', () => {
  it('should return a correct notification object', () => {
    const exchange = { id: 1, date: '2016-06-29' };
    const approvedUser = { fullName: 'User#1' };
    const actual = createNotification(exchange, approvedUser);

    const expected = {
      text: 'Goed nieuws, je dienst van woensdag 29 juni is geruild met User#1. High five!',
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
