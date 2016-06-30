import { assert } from 'chai';
import { createNotification } from './substitute-approved';

describe('You exchanged notification', () => {
  it('should return a correct notification object', () => {
    const exchange = {
      id: 1,
      User: { fullName: 'User#1' },
      date: '2016-06-29',
    };

    const actual = createNotification(exchange);
    const expected = {
      text: 'Goed nieuws, je hebt de shift van User#1 overgenomen. Je werkt nu op woensdag 29 juni.', // eslint-disable-line max-len
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
