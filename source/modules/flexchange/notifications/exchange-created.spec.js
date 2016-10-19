import { assert } from 'chai';
import moment from 'moment';
import { createNotification } from './exchange-created';

describe('Exchange created notification', () => {
  it('should return a correct notification object', () => {
    const futureMoment = moment().add(2, 'weeks');
    const exchange = { id: 1, date: futureMoment.format('YYYY-MM-DD') };
    const actual = createNotification(exchange);

    const expected = {
      text: `Er is een nieuwe shift beschikbaar op ${futureMoment.format('dddd D MMMM')}`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for today', () => {
    const futureMoment = moment().add(2, 'hrs');
    const exchange = { id: 1, date: futureMoment.format('YYYY-MM-DDTHH:mm') };
    const actual = createNotification(exchange);

    const expected = {
      text: `Er is een nieuwe shift beschikbaar vandaag om ${futureMoment.format('HH:mm')}`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
