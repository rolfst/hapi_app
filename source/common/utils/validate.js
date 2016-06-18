import Joi from 'joi';

export const validateId = {
  params: {
    id: Joi.number().integer(),
  },
};
