const { assert } = require('chai');
const moment = require('moment-timezone');
const { createNotification } = require('./substitute-approved');

describe('Substitude flexchange notification', () => {
  const createExchange = (baseMoment) => ({
    id: 1,
    date: baseMoment.utc().format('YYYY-MM-DD'),
    startTime: baseMoment.utc().hour(10).minute(30).toISOString(),
    endTime: baseMoment.utc().hour(13).minute(0).toISOString(),
    User: { id: 2, fullName: 'John Doe' },
  });

  const getLocalTime = (baseMoment) => ({
    startTime: moment(baseMoment.hour(10).minute(30)).tz('Europe/Amsterdam').format('HH:mm'),
    endTime: moment(baseMoment.hour(13).minute(0)).tz('Europe/Amsterdam').format('HH:mm'),
  });


  it('should return a correct notification object for today', () => {
    const futureMoment = moment();
    const exchange = createExchange(futureMoment);
    const localTime = getLocalTime(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: 'Je hebt de shift van John Doe overgenomen. Je werkt vandaag ' +
        `van ${localTime.startTime} tot ${localTime.endTime}.`,
      data: { id: 1, type: 'exchange', track_name: 'exchange_approved_substitute' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for tomorrow', () => {
    const futureMoment = moment().add(1, 'days');
    const exchange = createExchange(futureMoment);
    const localTime = getLocalTime(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: 'Je hebt de shift van John Doe overgenomen. Je werkt morgen ' +
        `van ${localTime.startTime} tot ${localTime.endTime}.`,
      data: { id: 1, type: 'exchange', track_name: 'exchange_approved_substitute' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for this week', () => {
    const futureMoment = moment().add(2, 'days');
    const exchange = createExchange(futureMoment);
    const localTime = getLocalTime(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: 'Je hebt de shift van John Doe overgenomen. Je werkt ' +
        `${futureMoment.format('dddd')} van ${localTime.startTime} tot ${localTime.endTime}.`,
      data: { id: 1, type: 'exchange', track_name: 'exchange_approved_substitute' },
    };

    assert.deepEqual(actual, expected);
  });

  it('should return a correct notification object for later than this week', () => {
    const futureMoment = moment().add(2, 'weeks');
    const exchange = createExchange(futureMoment);
    const localTime = getLocalTime(futureMoment);

    const actual = createNotification(exchange);
    const expected = {
      text: 'Je hebt de shift van John Doe overgenomen. Je werkt ' +
        `${futureMoment.format('dddd D MMMM')} van ${localTime.startTime} ` +
        `tot ${localTime.endTime}.`,
      data: { id: 1, type: 'exchange', track_name: 'exchange_approved_substitute' },
    };

    assert.deepEqual(actual, expected);
  });
});
