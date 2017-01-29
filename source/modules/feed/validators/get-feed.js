import Joi from 'joi';

export default {
  query: {
    limit: Joi.number().min(0).max(50).default(10, 'The default limit'),
    offset: Joi.number().min(0).default(0, 'The default offset'),
  },
};
