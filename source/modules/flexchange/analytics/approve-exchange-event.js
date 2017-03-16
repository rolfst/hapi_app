const moment = require('moment');

export default function (network, exchange) {
  return {
    name: 'Shift Takeover',
    data: {
      'Network Id': network.id,
      'Network Name': network.name,
      'Shift Created At': moment(exchange.created_at).toISOString(),
      'Created At': moment().toISOString(),
    },
  };
}
