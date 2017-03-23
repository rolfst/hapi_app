const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    roleType: Joi.valid('employee', 'admin'),
    teamIds: Joi.array().allow(null),
  })
    .rename('first_name', 'firstName')
    .rename('last_name', 'lastName')
    .rename('role_type', 'roleType')
    .rename('team_ids', 'teamIds'),
};
