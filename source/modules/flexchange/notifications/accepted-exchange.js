import moment from 'moment';
import 'moment/locale/nl';
moment.locale('nl');
import notify from 'common/services/notifier';
import { findAdminsByNetwork } from 'common/repositories/network';
import excludeUser from 'common/utils/exclude-users';

export const createNotification = (exchange, substituteUser) => {
  const substitute = substituteUser.fullName;
  const creator = exchange.User.fullName;
  const date = moment(exchange.date).format('dddd D MMMM');

  return {
    text: `${substitute} heeft aangegeven de shift van ${creator} op ${date}` +
    ' over te kunnen nemen. Open de app om dit goed te keuren.',
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (network, exchange, userThatAccepts) => {
  const admins = await findAdminsByNetwork(network);
  const usersToNotify = excludeUser(admins, userThatAccepts);
  const notification = createNotification(exchange, userThatAccepts);

  return notify(usersToNotify, notification);
};
