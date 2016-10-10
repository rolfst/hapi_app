import Joi from 'joi';

export default {
  payload: {
    externalId: Joi.string().required(),
    name: Joi.string().required(),
    integrationName: Joi.string().required(),
    userId: Joi.string().required(),
  },
};
