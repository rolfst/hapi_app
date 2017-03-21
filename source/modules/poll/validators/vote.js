import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    optionIds: Joi.array().required(),
  }).rename('option_ids', 'optionIds'),
};
