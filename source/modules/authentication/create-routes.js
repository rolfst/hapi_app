/* eslint-disable max-len */

import Joi from 'joi';
const basePath = 'modules/authentication/handlers';

export default [
  {
    method: 'POST',
    path: '/v2/authorize',
    handler: require(`${basePath}/authorize`).default,
    config: {
      validate: {
        payload: {
          username: Joi.string().required(),
          password: Joi.string().required(),
        },
      },
    },
  },
];
