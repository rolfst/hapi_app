import _ from 'lodash';
import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import { findCommentsByExchange } from 'modules/flexchange/repositories/comment';
import notify from 'common/services/notifier';

export const createNotification = (exchange, comment) => {
  const creator = comment.User.fullName;
  const text = comment.text;

  return {
    text: `${creator} reageerde: ${text}`,
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (comment) => {
  const exchange = await findExchangeById(comment.parent_id);
  const comments = await findCommentsByExchange(exchange);

  const users = comments.map(c => c.User).concat(exchange.User);
  const uniqueUsers = _.uniqBy(users, 'id');
  const usersToNotify = uniqueUsers.filter(u => u.id !== comment.User.id);

  const notification = createNotification(exchange, comment);

  notify(usersToNotify, notification);
};
