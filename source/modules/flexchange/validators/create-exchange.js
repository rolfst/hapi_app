import Joi from 'joi';

export default {
  payload: {
    title: Joi.string().min(5).required(),
    type: Joi.string().valid(['TEAM', 'USER', 'ALL']),
    description: Joi.string(),
    values: Joi.array().when('type', {
      is: 'TEAM',
      then: Joi.any().required(),
    }).when('type', {
      is: 'USER',
      then: Joi.any().required(),
    }),
    date: Joi.date().format('YYYY-MM-DD').required(),
    shift_id: Joi.number(),
  },
};
