import formatDate from 'adapters/pmt/format-date';

export default (pmtShift) => ({
  id: pmtShift.id,
  start_time: formatDate(pmtShift.start_time),
  end_time: formatDate(pmtShift.end_time),
  break: pmtShift.break,
  team_id: pmtShift.department,
});
