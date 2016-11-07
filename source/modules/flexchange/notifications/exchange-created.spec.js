import { assert } from 'chai';
import moment from 'moment';
import { createNotification } from './exchange-created';

describe('Exchange created notification', () => {
  const createExchange = (baseMoment) => ({
    id: 1,
    date: baseMoment.format('YYYY-MM-DD'),
    startTime: baseMoment.hour(10).minute(30).toISOString(),
    endTime: baseMoment.hour(13).minute(0).toISOString(),
    User: { id: 2, fullName: 'John Doe' },
  });

  const localTime = {
    startTime: moment().tz('Europe/Amsterdam').hour(10).minute(30).format('HH:mm'),
    endTime: moment().tz('Europe/Amsterdam').hour(13).minute(0).format('HH:mm'),
  };

  it('should return a correct notification object for today', () => {
    const futureMoment = moment();
    const exchange = createExchange(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: `John Doe zoekt een vervanger voor vandaag van ${localTime.startTime} ` +
        `tot ${localTime.endTime}.`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for tomorrow', () => {
    const futureMoment = moment().add(1, 'days');
    const exchange = createExchange(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: `John Doe zoekt een vervanger voor morgen van ${localTime.startTime} ` +
        `tot ${localTime.endTime}.`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for this week', () => {
    const futureMoment = moment().add(2, 'days');
    const exchange = createExchange(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: `John Doe zoekt een vervanger voor aankomende ${futureMoment.format('dddd')} ` +
        `van ${localTime.startTime} tot ${localTime.endTime}.`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for later than this week', () => {
    const futureMoment = moment().add(2, 'weeks');
    const exchange = createExchange(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: `John Doe zoekt een vervanger voor ${futureMoment.format('dddd D MMMM')} ` +
        `van ${localTime.startTime} tot ${localTime.endTime}.`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
