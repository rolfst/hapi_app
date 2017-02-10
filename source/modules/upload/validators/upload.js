import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    filename: Joi.string(),
    checksum: Joi.string(),
    width: Joi.number(),
    height: Joi.number(),
    filedata: Joi.binary().encoding('base64'),
  }),
};
