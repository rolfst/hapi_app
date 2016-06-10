/* eslint-disable max-len */

import Joi from 'joi';
const basePath = 'modules/authentication/handlers';

export default [
  {
    method: 'POST',
    path: '/v2/authenticate',
    handler: {
      async: require(`${basePath}/authenticate`).default,
    },
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
