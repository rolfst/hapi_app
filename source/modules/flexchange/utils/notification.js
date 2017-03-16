const moment = require('moment');

export const formatTime = (time) => moment(time).tz('Europe/Amsterdam').format('HH:mm');

export const createTimeText = (exchange) => (
  `${formatTime(exchange.startTime)} tot ${formatTime(exchange.endTime)}`
);
