import { user } from 'validators';

export default [
  {
    method: 'GET',
    path: '/users',
    handler: require('handlers/getUsers'),
    config: {
      auth: 'default',
    },
  }, {
    method: 'POST',
    path: '/users',
    handler: require('handlers/postUser'),
    config: {
      validate: user.create,
      auth: 'default',
    },
  },
];
