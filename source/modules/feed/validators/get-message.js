import Joi from 'joi';

export default {
  query: {
    include: Joi.string(),
  },
};
