const moment = require('moment');

const defaultDateFormat = 'YYYY-MM-DD';
const toISOString = (dateString) => moment(dateString).toISOString();
const toDateFormat = (dateString) => moment(dateString).format(defaultDateFormat);
const toUTC = (dateISOString) => moment.utc(dateISOString).toISOString();

exports.toISOString = toISOString;
exports.toDateFormat = toDateFormat;
exports.toUTC = toUTC;
