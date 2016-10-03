import { assert } from 'chai';
import { createNotification } from './new-exchange-comment';

describe('Exchange comment created notification', () => {
  it('should return a correct notification object', () => {
    const exchange = { id: 1 };
    const comment = { text: 'Testing', User: {
      fullName: 'User#1',
    } };

    const actual = createNotification(exchange, comment);
    const expected = {
      text: 'User#1 reageerde: Testing',
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});