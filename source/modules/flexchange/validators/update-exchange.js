const Joi = require('joi');

module.exports = {
  payload: Joi.object()
    .keys({
      title: Joi.string().min(5),
      description: Joi.string().allow(null).empty(''),
      startTime: Joi.date().iso().label('start_time'),
      endTime: Joi.date().iso().label('end_time'),
    })
    .rename('start_time', 'startTime')
    .rename('end_time', 'endTime')
    .and('startTime', 'endTime'),
};
