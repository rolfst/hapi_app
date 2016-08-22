import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    title: Joi.string().min(5),
    description: Joi.string(),
    start_time: Joi.date().iso(),
    end_time: Joi.date().iso(),
  }).and('start_time', 'end_time'),
};
