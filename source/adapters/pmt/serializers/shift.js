import moment from 'moment';

export default (externalShift) => ({
  id: externalShift.id,
  date: moment(externalShift.start_time, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD'),
  start_time: moment(externalShift.start_time, 'DD-MM-YYYY HH:mm:ss').toISOString(),
  end_time: moment(externalShift.end_time, 'DD-MM-YYYY HH:mm:ss').toISOString(),
  break: externalShift.break,
  team_id: externalShift.department,
});
