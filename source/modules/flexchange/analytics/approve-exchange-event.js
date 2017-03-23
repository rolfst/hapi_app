const moment = require('moment');

module.exports = (network, exchange) => ({
  name: 'Shift Takeover',
  data: {
    'Network Id': network.id,
    'Network Name': network.name,
    'Shift Created At': moment(exchange.created_at).toISOString(),
    'Created At': moment().toISOString(),
  },
});
