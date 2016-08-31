import moment from 'moment';
import 'moment/locale/nl';
moment.locale('nl');
import notifier from 'common/services/notifier';
import { findAdminsByNetwork } from 'common/repositories/network';

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
  const usersToNotify = admins.filter(u => u.id !== userThatAccepts.id);
  const notification = createNotification(exchange, userThatAccepts);

  return notifier.send(usersToNotify, notification);
};
