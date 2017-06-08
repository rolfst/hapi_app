const moment = require('moment');
const notifier = require('../../../shared/services/notifier');
const notificationUtils = require('../utils/notification');

const createNotification = (exchange) => {
  const date = moment(exchange.date).calendar(null, {
    sameDay: '[van] [vandaag]',
    nextDay: '[van] [morgen]',
    nextWeek: '[van] dddd',
    sameElse: '[op] dddd DD MMMM',
  });

  return {
    text: `${exchange.ApprovedUser.getFullName()} heeft je shift ${date} van ` +
      `${notificationUtils.createTimeText(exchange)} overgenomen.`,
    data: { id: exchange.id, type: 'exchange', track_name: 'exchange_approved_creator' },
  };
};

const send = async (exchange, network) => {
  const notification = createNotification(exchange);

  return notifier.send([exchange.User], notification, network.id, network.organisationId);
};

exports.createNotification = createNotification;
exports.send = send;
