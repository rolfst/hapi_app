import Joi from 'joi';
import { validateId } from 'common/utils/validate';

export default {
  create: {
    payload: {
      type: Joi.string().valid('private', 'group').required(),
      users: Joi.array().required(),
    },
  },
  detail: validateId,
  delete: validateId,
};
