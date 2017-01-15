import Joi from 'joi';

export default {
  query: {
    include: Joi.any().valid(['messages']),
  },
};
