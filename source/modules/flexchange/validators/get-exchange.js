const Joi = require('joi');

module.exports = {
  query: Joi.object().keys({
    include: Joi.string().valid(['responses', 'comments']),
    start: Joi.date().format('YYYY-MM-DD'),
    end: Joi.date().format('YYYY-MM-DD'),
  }).with('end', 'start'),
};
