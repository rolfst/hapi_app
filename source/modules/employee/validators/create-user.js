import Joi from 'joi';

export default {
  payload: {
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    role_type: Joi.valid('employee', 'admin'),
    team_ids: Joi.array().allow(null),
  },
};
