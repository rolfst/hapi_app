import Joi from 'joi';

export default {
  payload: {
    type: Joi.string().valid('private', 'group').required(),
    participantIds: Joi.array().unique().required(),
  },
};
