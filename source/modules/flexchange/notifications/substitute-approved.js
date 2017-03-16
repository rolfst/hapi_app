const moment = require('moment');
const notifier = require('../../../shared/services/notifier');
const notificationUtils = require('../utils/notification');

export const createNotification = (exchange) => {
  const creator = exchange.User.fullName;
  const date = moment(exchange.date).calendar(null, {
    sameDay: '[vandaag]',
    nextDay: '[morgen]',
    nextWeek: 'dddd',
    sameElse: 'dddd D MMMM',
  });

  return {
    text: `Je hebt de shift van ${creator} overgenomen. Je werkt ${date} van ` +
      `${notificationUtils.createTimeText(exchange)}.`,
    data: { id: exchange.id, type: 'exchange', track_name: 'exchange_approved_substitute' },
  };
};

export const send = async (exchange) => {
  const approvedUser = await exchange.getApprovedUser();
  const notification = createNotification(exchange);

  return notifier.send([approvedUser], notification);
};
