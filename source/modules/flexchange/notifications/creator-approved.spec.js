import { assert } from 'chai';
import moment from 'moment-timezone';
import { createNotification } from './creator-approved';

describe('Your exchange approved notification', () => {
  const createExchange = (baseMoment) => ({
    id: 1,
    date: baseMoment.utc().format('YYYY-MM-DD'),
    startTime: baseMoment.utc().hour(10).minute(30).toISOString(),
    endTime: baseMoment.utc().hour(13).minute(0).toISOString(),
    User: { id: 2, fullName: 'John Doe' },
    ApprovedUser: { fullName: 'Pietje overnemer' },
  });

  const localTime = {
    startTime: moment(moment().hour(10).minute(30)).tz('Europe/Amsterdam').format('HH:mm'),
    endTime: moment(moment().hour(13).minute(0)).tz('Europe/Amsterdam').format('HH:mm'),
  };

  it('should return a correct notification object for today', () => {
    const futureMoment = moment();
    const exchange = createExchange(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: `Pietje overnemer heeft je shift van vandaag van ${localTime.startTime} ` +
        `tot ${localTime.endTime} overgenomen.`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for tomorrow', () => {
    const futureMoment = moment().add(1, 'days');
    const exchange = createExchange(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: `Pietje overnemer heeft je shift van morgen van ${localTime.startTime} ` +
        `tot ${localTime.endTime} overgenomen.`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for this week', () => {
    const futureMoment = moment().add(2, 'days');
    const exchange = createExchange(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: `Pietje overnemer heeft je shift van ${futureMoment.format('dddd')} ` +
        `van ${localTime.startTime} tot ${localTime.endTime} overgenomen.`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for later than this week', () => {
    const futureMoment = moment().add(2, 'weeks');
    const exchange = createExchange(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: `Pietje overnemer heeft je shift op ${futureMoment.format('dddd DD MMMM')} ` +
        `van ${localTime.startTime} tot ${localTime.endTime} overgenomen.`,
      data: { id: 1, type: 'exchange' },
    };

    assert.deepEqual(actual, expected);
  });
});
