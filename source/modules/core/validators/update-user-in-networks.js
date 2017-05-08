const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    networks: Joi.array().required().min(1).items(Joi.object()
      .keys({
        networkId: Joi.number().required(),
        roleType: Joi.string().required(),
      })
      .rename('network_id', 'networkId')
      .rename('role_type', 'roleType')
    ),
  }),
  params: {
    organisationId: Joi.number().required(),
    userId: Joi.number().required(),
  },
};
