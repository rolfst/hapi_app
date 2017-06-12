const moment = require('moment');
const notifier = require('../../../shared/services/notifier');
const notificationUtils = require('../utils/notification');

const createNotification = (exchange) => {
  const date = moment(exchange.date).calendar(null, {
    sameDay: '[vandaag]',
    nextDay: '[morgen]',
    nextWeek: 'dddd',
    sameElse: 'dddd D MMMM',
  });

  return {
    text: `Je hebt de shift van ${exchange.User.getFullName()} overgenomen. Je werkt ${date} van ` +
      `${notificationUtils.createTimeText(exchange)}.`,
    data: { id: exchange.id, type: 'exchange', track_name: 'exchange_approved_substitute' },
  };
};

const send = async (exchange, network) => {
  const notification = createNotification(exchange);

  return notifier.send([exchange.ApprovedUser], notification, network.id, network.organisationId);
};

exports.createNotification = createNotification;
exports.send = send;
