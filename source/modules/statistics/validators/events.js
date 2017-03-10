import Joi from 'joi';

export default {
  params: Joi.object().keys({
    networkId: Joi.string().required(),
  }),
  query: Joi.object().keys({
    startDate: Joi.date(),
    endDate: Joi.date(),
  }).rename('start_date', 'startDate').rename('end_date', 'endDate'),
};
