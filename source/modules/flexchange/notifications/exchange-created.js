const moment = require('moment');
const notifier = require('../../../shared/services/notifier');
const notificationUtils = require('../utils/notification');

const createNotification = (exchange) => {
  const date = moment(exchange.date).calendar(null, {
    sameDay: '[voor] [vandaag]',
    nextDay: '[voor] [morgen]',
    nextWeek: '[voor] [aankomende] dddd',
    sameElse: '[voor] dddd D MMMM',
  });

  return {
    text: `${exchange.User.fullName} zoekt een vervanger ${date} van ` +
      `${notificationUtils.createTimeText(exchange)}.`,
    data: { id: exchange.id, type: 'exchange', track_name: 'created_exchange' },
  };
};

const send = async (users, exchange) => {
  const notification = createNotification(exchange);

  notifier.send(users, notification);
};

// exports of functions
module.export = {
  createNotification,
  send,
};
