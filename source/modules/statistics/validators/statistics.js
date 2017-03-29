const Joi = require('joi');

module.exports = {
  params: Joi.object().keys({
    networkId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    viewName: Joi.string().required().valid('created_messages', 'approved_shifts', 'created_shifts').label('q'),
    type: Joi.string().required().when('viewName', {
      is: 'created_messages',
      then: Joi.valid('user', 'team'),
      otherwise: Joi.valid('user'),
    }),
    startDate: Joi.date().label('start_date'),
    endDate: Joi.date().label('end_date'),
  })
  .rename('start_date', 'startDate')
  .rename('end_date', 'endDate')
  .rename('q', 'viewName'),
};
