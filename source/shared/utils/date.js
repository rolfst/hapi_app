import moment from 'moment-timezone';

const defaultTimezone = 'Europe/Amsterdam';
const defaultDateFormat = 'YYYY-MM-DD';

export const getLocalDate = (dateString, format) => moment(dateString, format).tz(defaultTimezone);

export const toISOString = dateString => getLocalDate(dateString).toISOString();

export const toDateFormat = dateString => getLocalDate(dateString).format(defaultDateFormat);
