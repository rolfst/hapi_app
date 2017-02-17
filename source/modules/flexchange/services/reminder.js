import Promise from 'bluebird';
import moment from 'moment';
import { filter, map, uniqBy, pick } from 'lodash';
import * as notifier from '../../../shared/services/notifier';
import * as networkRepo from '../../core/repositories/network';
import * as exchangeRepo from '../repositories/exchange';
import createReminderExchangeNotification from '../notifications/accepted-exchange-reminder';
import * as Logger from '../../../shared/services/logger';

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

export const sendReminder = async () => {
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
