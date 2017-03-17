const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    action: Joi.any().required().valid(['accept', 'decline', 'approve', 'reject']),
    user_id: Joi.number().when('action', {
      is: 'approve',
      then: Joi.any().required(),
    }).when('action', {
      is: 'reject',
      then: Joi.any().required(),
    }),
  })
    .rename('user_id', 'userId'),
};
