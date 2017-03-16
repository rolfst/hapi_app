const { string, date } = require('joi');

module.exports = {
  payload: {
    first_name: string().rename('firstName'),
    last_name: string().rename('lastName'),
    email: string().email(),
    password: string(),
    address: string(),
    zip_code: string().rename('zipCode'),
    date_of_birth: date().format('YYYY-MM-DD').rename('dateOfBirth'),
    phone_num: string().rename('phoneNum'),
  },
};
