import _ from 'lodash';
import * as notifier from '../../../shared/services/notifier';
import * as exchangeRepo from '../repositories/exchange';
import { findCommentsByExchange } from '../repositories/comment';

export const createNotification = (exchange, comment) => {
  const creator = comment.User.fullName;
  const text = comment.text;

  return {
    text: `${creator} reageerde: ${text}`,
    data: { id: exchange.id, type: 'exchange', track_name: 'exchange_comment' },
  };
};

export const send = async (comment) => {
  const exchange = await exchangeRepo.findExchangeById(comment.exchangeId);

  const comments = await findCommentsByExchange(exchange);

  const users = comments.map(c => c.User).concat(exchange.User);
  const uniqueUsers = _.uniqBy(users, 'id');
  const usersToNotify = uniqueUsers.filter(u => u.id !== comment.User.id);

  const notification = createNotification(exchange, comment);

  notifier.send(usersToNotify, notification);
};
