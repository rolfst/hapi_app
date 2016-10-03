import { assert } from 'chai';
import { createNotification } from './exchange-created';

describe('Exchange created notification', () => {
  it('should return a correct notification object', () => {
    const exchange = {
      id: 1,
      date: '2016-06-29',
      User: { fullName: 'User#1' },
    };

    const actual = createNotification(exchange);
    const expected = {
      text: 'Ik kan niet werken op woensdag 29 juni, kun jij voor mij werken? - User#1',
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
