import { assert } from 'chai';
import { createNotification } from './accepted-exchange';

describe('Accepted exchange notification', () => {
  it('should return a correct notification object', () => {
    const exchange = {
      id: 1,
      User: { fullName: 'User#1' },
      date: '2016-06-29',
    };

    const substitute = { fullName: 'User#2' };
    const actual = createNotification(exchange, substitute);
    const expected = {
      text: 'User#2 heeft aangegeven de shift van User#1 te kunnen werken.',
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
