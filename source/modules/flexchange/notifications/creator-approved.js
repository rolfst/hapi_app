const R = require('ramda');
const moment = require('moment');
const notifier = require('../../../shared/services/notifier');
const notificationUtils = require('../utils/notification');
const userService = require('../../core/services/user');
const exchangeRepo = require('../repositories/exchange');

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

const send = async (id, network) => {
  const exchanges = await exchangeRepo.findAllBy({ id });
  const exchange = R.head(exchanges);
  const notification = createNotification(exchange);

  return notifier.send([exchange.User], notification, network.id, network.organisationId);
};

exports.createNotification = createNotification;
exports.send = send;
