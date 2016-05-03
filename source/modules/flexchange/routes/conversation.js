import validators from 'modules/chat/validators';

export default [
  {
    method: 'GET',
    path: '/exchanges/sync',
    handler: require('modules/flexchange/handlers/sync-exchanges'),
    config: {
      auth: 'default',
    },
  },
];
