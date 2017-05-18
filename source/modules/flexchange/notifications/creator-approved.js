const R = require('ramda');
const moment = require('moment');
const notifier = require('../../../shared/services/notifier');
const notificationUtils = require('../utils/notification');
const userService = require('../../core/services/user');
const exchangeRepo = require('../repositories/exchange');

const createNotification = (exchange, approvedUser) => {
  const date = moment(exchange.date).calendar(null, {
    sameDay: '[van] [vandaag]',
    nextDay: '[van] [morgen]',
    nextWeek: '[van] dddd',
    sameElse: '[op] dddd DD MMMM',
  });

  return {
    text: `${approvedUser.fullName} heeft je shift ${date} van ` +
      `${notificationUtils.createTimeText(exchange)} overgenomen.`,
    data: { id: exchange.id, type: 'exchange', track_name: 'exchange_approved_creator' },
  };
};

const send = async (id) => {
  const exchanges = await exchangeRepo.findAllBy({ id });
  const exchange = R.head(exchanges);
  const [creator, approvedUser] = await Promise.all([
    userService.getUser({ userId: exchange.userId }),
    userService.getUser({ userId: exchange.approvedUserId }),
  ]);
  const notification = createNotification(exchange, approvedUser);

  return notifier.send([creator], notification);
};

exports.createNotification = createNotification;
exports.send = send;
