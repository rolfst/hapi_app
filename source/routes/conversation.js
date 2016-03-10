import { validateId } from '../services/validate';

export default [
  {
    method: 'GET',
    path: '/conversations',
    handler: require('../handlers/getConversations'),
  },
  {
    method: 'GET',
    path: '/conversations/{id}',
    handler: require('../handlers/getConversation'),
    config: {
      validate: validateId,
    },
  },
];
