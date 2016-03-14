import Joi from 'joi';
import { validateId } from 'services/validate';

module.exports = {
  create: {
    payload: {
      type: Joi.string().valid('private', 'group').required(),
      users: Joi.array().required(),
    },
  },
  detail: validateId,
  delete: validateId,
};
