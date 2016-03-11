import { user } from 'validators';

export default [
  {
    method: 'GET',
    path: '/users',
    handler: require('handlers/getUsers'),
  }, {
    method: 'GET',
    path: '/conversations/{id}',
    handler: require('handlers/getUsers'),
    config: {
      validate: user.detail,
    },
  }, {
    method: 'POST',
    path: '/users',
    handler: require('handlers/postUser'),
    config: {
      validate: user.create,
    },
  },
];
