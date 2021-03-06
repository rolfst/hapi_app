const _ = require('lodash');
const notifier = require('../../../shared/services/notifier');
const exchangeRepo = require('../repositories/exchange');
const { findCommentsByExchange } = require('../repositories/comment');


const createNotification = (exchange, comment) => {
  const creator = comment.user.fullName;
  const text = comment.text;

  return {
    text: `${creator} reageerde: ${text}`,
    data: { id: exchange.id, type: 'exchange', track_name: 'exchange_comment' },
  };
};

const send = async (comment, network) => {
  const exchange = await exchangeRepo.findExchangeById(comment.exchangeId);

  const comments = await findCommentsByExchange(exchange);

  const users = comments.map((c) => c.User).concat(exchange.User);
  const uniqueUsers = _.uniqBy(users, 'id');
  const usersToNotify = uniqueUsers.filter((u) => u.id.toString() !== comment.user.id);
  const notification = createNotification(exchange, comment);

  notifier.send(usersToNotify, notification, network.id, network.organisationId);
};

exports.createNotification = createNotification;
exports.send = send;
