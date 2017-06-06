const moment = require('moment');

const defaultDateFormat = 'YYYY-MM-DD';
const defaultDateTimeFormat = 'YYYY-MM-DD HH:mm:ss';

const toISOString = (dateString) => moment(dateString).toISOString();
const toDateFormat = (dateString) => moment(dateString).format(defaultDateFormat);
const toPlainDateTime = (dateISOString) => moment(dateISOString).format(defaultDateTimeFormat);

exports.toISOString = toISOString;
exports.toDateFormat = toDateFormat;
exports.toPlainDateTime = toPlainDateTime;
