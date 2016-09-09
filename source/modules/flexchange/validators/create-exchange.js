import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    title: Joi.string().min(5),
    type: Joi.string().valid(['TEAM', 'ALL', 'USER']),
    description: Joi.string().empty(''),
    values: Joi.array().when('type', {
      is: ['ALL'],
      then: Joi.forbidden(),
    }),
    date: Joi.date().format('YYYY-MM-DD').required(),
    shift_id: Joi.number().when('type', {
      is: ['USER'],
      then: Joi.required(),
    }).when('type', {
      is: ['ALL', 'TEAM'],
      then: Joi.forbidden(),
    }),
    team_id: Joi.number(),
    start_time: Joi.date().iso().required(),
    end_time: Joi.date().iso().required(),
  }).and('start_time', 'end_time').and('shift_id', 'team_id'),
};
