const Joi = require('joi');

module.exports = {
  payload: {
    first_name: Joi.string().required().rename('firstName'),
    last_name: Joi.string().required().rename('lastName'),
    email: Joi.string().email().required(),
    role_type: Joi.valid('employee', 'admin').rename('roleType'),
    team_ids: Joi.array().allow(null).rename('teamIds'),
  },
};
