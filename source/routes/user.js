import { user } from 'validators';

export default [
  {
    method: 'GET',
    path: '/users',
    handler: require('handlers/getUsers'),
  }, {
    method: 'POST',
    path: '/users',
    handler: require('handlers/postUser'),
    config: {
      validate: user.create,
    },
  },
];
