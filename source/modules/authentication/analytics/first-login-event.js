const moment = require('moment');

module.exports = () => ({
  name: 'First Login',
  data: {
    'Logged In At': moment().toISOString(),
  },
});
