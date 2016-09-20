import moment from 'moment';

const defaultDateFormat = 'YYYY-MM-DD';

export const toISOString = dateString => moment(dateString).toISOString();

export const toDateFormat = dateString => moment(dateString).format(defaultDateFormat);
