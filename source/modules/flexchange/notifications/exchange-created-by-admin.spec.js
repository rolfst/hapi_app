import { assert } from 'chai';
import { createNotification } from './exchange-created-by-admin';

describe('Exchange created by admin notification', () => {
  it('should return a correct notification object', () => {
    const exchange = { id: 1, date: '2016-06-29' };
    const actual = createNotification(exchange);
    const expected = {
      text: 'Er is een shift aangeboden op woensdag 29 juni, kun jij deze dienst werken?',
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
