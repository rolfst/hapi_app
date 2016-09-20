import moment from 'moment';

const incomingDateFormat = 'DD-MM-YYYY HH:mm:ss';

export default (externalShift) => {
  return {
    id: externalShift.id,
    date: moment.utc(externalShift.start_time, incomingDateFormat).format('YYYY-MM-DD'),
    start_time: moment.utc(externalShift.start_time, incomingDateFormat).toISOString(),
    end_time: moment.utc(externalShift.end_time, incomingDateFormat).toISOString(),
    break: externalShift.break,
    team_id: externalShift.department,
  };
};
