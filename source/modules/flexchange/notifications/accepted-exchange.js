import moment from 'moment';
import 'moment/locale/nl';
import * as notifier from '../../../shared/services/notifier';
import * as networkRepo from '../../core/repositories/network';

moment.locale('nl');

export const createNotification = (exchange, substituteUser) => {
  const substitute = substituteUser.fullName;
  const creator = exchange.User.fullName;

  return {
    text: `${substitute} heeft aangegeven de shift van ${creator}` +
    ' te kunnen werken.',
    data: { id: exchange.id, type: 'exchange', track_name: 'accepted_exchange' },
  };
};

export const send = async (network, exchange, userThatAccepts) => {
  const admins = await networkRepo.findUsersForNetwork({
    networkId: network.id, roleType: 'ADMIN' });
  const usersToNotify = admins.filter(u => u.id !== userThatAccepts.id);
  const notification = createNotification(exchange, userThatAccepts);

  return notifier.send(usersToNotify, notification);
};
