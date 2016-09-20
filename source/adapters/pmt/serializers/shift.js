import * as dateUtils from '../../../shared/utils/date';

const incomingDateFormat = 'DD-MM-YYYY HH:mm:ss';

export default (externalShift) => ({
  id: externalShift.id,
  date: dateUtils.getLocalDate(externalShift.start_time, incomingDateFormat).format('YYYY-MM-DD'),
  start_time: dateUtils.getLocalDate(externalShift.start_time, incomingDateFormat).toISOString(),
  end_time: dateUtils.getLocalDate(externalShift.end_time, incomingDateFormat).toISOString(),
  break: externalShift.break,
  team_id: externalShift.department,
});
