import * as dateUtils from '../../../shared/utils/date';

export default (externalShift) => ({
  id: externalShift.id,
  date: dateUtils.getLocalDate(externalShift.start_time, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD'),
  start_time: dateUtils.getLocalDate(externalShift.start_time, 'DD-MM-YYYY HH:mm:ss').toISOString(),
  end_time: dateUtils.getLocalDate(externalShift.end_time, 'DD-MM-YYYY HH:mm:ss').toISOString(),
  break: externalShift.break,
  team_id: externalShift.department,
});
