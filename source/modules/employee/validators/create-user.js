const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    role_type: Joi.valid('employee', 'admin'),
    team_ids: Joi.array().allow(null),
  })
    .rename('first_name', 'firstName')
    .rename('last_name', 'lastName')
    .rename('role_type', 'roleType')
    .rename('team_ids', 'teamIds'),
};
