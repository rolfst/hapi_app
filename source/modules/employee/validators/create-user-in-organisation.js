const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    roleType: Joi.valid('employee', 'admin'),
    networks: Joi.array().items(Joi.object().keys({
      id: Joi.string().required(),
      roleType: Joi.string().required().valid('employee', 'admin').label('role_type'),
    })
    .rename('role_type', 'roleType')
    ),
  })
    .rename('first_name', 'firstName')
    .rename('last_name', 'lastName')
    .rename('role_type', 'roleType')
    .rename('team_ids', 'teamIds'),
};
