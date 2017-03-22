const moment = require('moment');

const formatTime = (time) => moment(time).tz('Europe/Amsterdam').format('HH:mm');

const createTimeText = (exchange) => (
  `${formatTime(exchange.startTime)} tot ${formatTime(exchange.endTime)}`
);

module.exports = {
  createTimeText,
  formatTime,
};
