import { map, last } from 'lodash';
import * as dateUtils from '../../../../shared/utils/date';
import createUserModel from '../../../core/models/user';
import createMessageModel from './message';

export default (dao) => ({
  type: 'conversation',
  id: dao.id.toString(),
  createdAt: dateUtils.toISOString(dao.created_at),
  lastMessage: (dao.Messages && dao.Messages.length > 0) ?
    createMessageModel(last(dao.Messages)) : null,
  messages: (dao.Messages && dao.Messages.length > 0) ?
    map(dao.Messages, createMessageModel) : [],
  users: (dao.Users && dao.Users.length > 0) ?
    map(dao.Users, createUserModel) : [],
});
