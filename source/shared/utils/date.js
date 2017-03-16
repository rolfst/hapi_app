const moment = require('moment');

const defaultDateFormat = 'YYYY-MM-DD';

const toISOString = dateString => moment(dateString).toISOString();

const toDateFormat = dateString => moment(dateString).format(defaultDateFormat);

module.exports = {
  toISOString,
  toDateFormat,
};
