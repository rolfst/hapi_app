const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    title: Joi.string().min(5),
    type: Joi.string().valid(['TEAM', 'ALL', 'USER']),
    description: Joi.string().allow(null).empty(''),
    values: Joi.array(),
    date: Joi.date().format('YYYY-MM-DD').required(),
    shiftId: Joi.number().when('type', {
      is: ['USER'],
      then: Joi.required(),
    }).when('type', {
      is: ['ALL', 'TEAM'],
      then: Joi.forbidden(),
    }),
    teamId: Joi.number(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
  })
    .rename('start_time', 'startTime')
    .rename('end_time', 'endTime')
    .rename('shift_id', 'shiftId')
    .rename('team_id', 'teamId')
    .and('startTime', 'endTime').and('shiftId', 'teamId'),
};
