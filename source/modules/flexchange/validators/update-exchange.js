const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    title: Joi.string().min(5),
    description: Joi.string().allow(null).empty(''),
    startTime: Joi.date().iso(),
    endTime: Joi.date().iso(),
  })
    .rename('start_time', 'startTime')
    .rename('end_time', 'endTime')
    .and('startTime', 'endTime'),
};
