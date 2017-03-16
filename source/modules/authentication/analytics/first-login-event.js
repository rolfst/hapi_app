const moment = require('moment');

export default function () {
  return {
    name: 'First Login',
    data: {
      'Logged In At': moment().toISOString(),
    },
  };
}
