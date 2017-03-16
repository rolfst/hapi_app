const moment = require('moment-timezone');

const createUTCDate = (time, dateFormat = 'DD-MM-YYYY HH:mm:ss') =>
  moment.tz(time, dateFormat, 'Europe/Amsterdam').tz('UTC');

module.exports = (externalShift) => ({
  id: externalShift.id,
  date: createUTCDate(externalShift.start_time).format('YYYY-MM-DD'),
  start_time: createUTCDate(externalShift.start_time).toISOString(),
  end_time: createUTCDate(externalShift.end_time).toISOString(),
  break: externalShift.break,
  team_id: externalShift.department,
});
