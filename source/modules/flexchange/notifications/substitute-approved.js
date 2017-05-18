const R = require('ramda');
const moment = require('moment');
const notifier = require('../../../shared/services/notifier');
const notificationUtils = require('../utils/notification');
const userService = require('../../core/services/user');
const exchangeRepo = require('../repositories/exchange');

const createNotification = (exchange, creator) => {
  const date = moment(exchange.date).calendar(null, {
    sameDay: '[vandaag]',
    nextDay: '[morgen]',
    nextWeek: 'dddd',
    sameElse: 'dddd D MMMM',
  });

  return {
    text: `Je hebt de shift van ${creator.fullName} overgenomen. Je werkt ${date} van ` +
      `${notificationUtils.createTimeText(exchange)}.`,
    data: { id: exchange.id, type: 'exchange', track_name: 'exchange_approved_substitute' },
  };
};

const send = async (id) => {
  const exchanges = await exchangeRepo.findAllBy({ id });
  const exchange = R.head(exchanges);
  const [creator, approvedUser] = await Promise.all([
    userService.getUser({ userId: exchange.userId }),
    userService.getUser({ userId: exchange.approvedUserId }),
  ]);
  const notification = createNotification(exchange, creator);

  return notifier.send([approvedUser], notification);
};

exports.createNotification = createNotification;
exports.send = send;
