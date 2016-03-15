import Joi from 'joi';
import { validateId } from 'services/validate';

module.exports = {
  create: {
    payload: {
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string(),
    },
  },
  detail: validateId,
  delete: validateId,
};
