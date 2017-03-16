const { string, date } = require('joi');

module.exports = {
  payload: {
    first_name: string(),
    last_name: string(),
    email: string().email(),
    password: string(),
    address: string(),
    zip_code: string(),
    date_of_birth: date().format('YYYY-MM-DD'),
    phone_num: string(),
  },
};
