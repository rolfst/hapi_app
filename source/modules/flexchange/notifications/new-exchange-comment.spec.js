const { assert } = require('chai');
const { createNotification } = require('./new-exchange-comment');

describe('Exchange comment created notification', () => {
  it('should return a correct notification object', () => {
    const exchange = { id: 1 };
    const comment = { text: 'Testing', user: { fullName: 'User#1' } };

    const actual = createNotification(exchange, comment);
    const expected = {
      text: 'User#1 reageerde: Testing',
      data: { id: 1, type: 'exchange', track_name: 'exchange_comment' },
    };

    assert.deepEqual(actual, expected);
  });
});
