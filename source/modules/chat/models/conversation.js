import { map } from 'lodash';
import * as dateUtils from '../../../shared/utils/date';
import createMessageModel from './message';
import createUserModel from '../../core/models/user';

export default (dao) => ({
  type: 'conversation',
  id: dao.id.toString(),
  createdAt: dateUtils.toISOString(dao.created_at),
  lastMessage: dao.LastMessage ? createMessageModel(dao.LastMessage) : null,
  users: dao.Users.length > 0 ?
    map(dao.Users, createUserModel) : [],
});
