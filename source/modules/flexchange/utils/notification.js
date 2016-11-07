import moment from 'moment';

export const formatTime = (time) => {
  moment.locale('nl');

  return moment(time).format('HH:mm');
};

export const createTimeText = (exchange) => (
  `${formatTime(exchange.startTime)} tot ${formatTime(exchange.endTime)}`
);
