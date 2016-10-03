import Joi from 'joi';

export default {
  payload: {
    networkId: Joi.string().required(),
    name: Joi.string().required(),
    integrationName: Joi.string().required(),
    userId: Joi.string().required(),
    username: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    dateOfBirth: Joi.string().regex(/^\d{4}\-\d{2}\-\d{2}/),
    phoneNum: Joi.string().required(),
    email: Joi.string().email().required(),
    isAdmin: Joi.boolean(),
    isActive: Joi.boolean(),
    teamId: Joi.string(),
  },
};
