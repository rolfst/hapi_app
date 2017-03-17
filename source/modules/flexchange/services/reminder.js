const Promise = require('bluebird');
const moment = require('moment');
const { filter, map, uniqBy, pick } = require('lodash');
const notifier = require('../../../shared/services/notifier');
const networkRepo = require('../../core/repositories/network');
const exchangeRepo = require('../repositories/exchange');
const createReminderExchangeNotification = require('../notifications/accepted-exchange-reminder');
const Logger = require('../../../shared/services/logger');

const logger = Logger.createLogger('FLEXCHANGE/service/reminder');

const createAdminInfo = (admins) => {
  return map(filter(admins, (u) => u),
    (admin) => pick(admin, 'email'));
};

const createNotificationData = async (exchange) => {
  const network = await networkRepo.findNetworkById(exchange.networkId);
  const admins = await networkRepo.findUsersForNetwork(network.id, { roleType: 'ADMIN' });
  const usersToNotify = createAdminInfo(admins);

  return { network, admins: usersToNotify };
};

const sendReminder = async () => {
  logger.info('Start send reminders for accepted exchanges');

  try {
    const twoDaysFromToday = moment().add(2, 'd');
    const exchanges = await exchangeRepo.findAllAcceptedExchanges(twoDaysFromToday);
    const notificationData = await Promise.map(exchanges, await createNotificationData);
    const simplefiedNotificationData = uniqBy(notificationData, (data) => data.network.id);

    await map(simplefiedNotificationData, (value) => {
      const notification = createReminderExchangeNotification();

      notifier.send(value.admins, notification, value.network.id);
    });

    logger.info(`Finished sending ${exchanges.length} reminders`);
  } catch (err) {
    logger.warn('Sending reminder went wrong', { err });
  }
};

if (require.main === module) sendReminder();


// exports of functions
module.export = {
  sendReminder
};
