const { map, last } = require('lodash');
const dateUtils = require('../../../../shared/utils/date');
const createUserModel = require('../../../core/models/user');
const createMessageModel = require('./message');

export default (dao) => ({
  type: 'conversation',
  id: dao.id.toString(),
  createdAt: dateUtils.toISOString(dao.created_at),
  updatedAt: dateUtils.toISOString(dao.updated_at),
  lastMessage: (dao.Messages && dao.Messages.length > 0) ?
    createMessageModel(last(dao.Messages)) : null,
  messages: (dao.Messages && dao.Messages.length > 0) ?
    map(dao.Messages, createMessageModel) : [],
  users: (dao.Users && dao.Users.length > 0) ?
    map(dao.Users, createUserModel) : [],
});
