const moment = require('moment');

export default function (network, exchange) {
  return {
    name: 'Created Shift',
    data: {
      'Network Id': network.id,
      'Network Name': network.name,
      'Placed For': exchange.type,
      'Placed At Day': moment(exchange.date).format('dddd'),
      'Created At': moment().toISOString(),
    },
  };
}
