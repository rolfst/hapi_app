const Joi = require('joi');

module.exports = {
  params: Joi.object().keys({
    networkId: Joi.string().required(),
    viewName: Joi.string().valid('created_messages', 'approved_shifts', 'created_shifts'),
  }),
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date(),
  }).rename('start_date', 'startDate').rename('end_date', 'endDate'),
};
