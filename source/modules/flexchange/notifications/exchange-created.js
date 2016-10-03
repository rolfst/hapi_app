import moment from 'moment';
import 'moment/locale/nl';
moment.locale('nl');
import notifier from 'shared/services/notifier';

export const createNotification = (exchange) => {
  const date = moment(exchange.date).format('dddd D MMMM');
  const creator = exchange.User.fullName;

  return {
    text: `Ik kan niet werken op ${date}, kun jij voor mij werken? - ${creator}`,
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (users, exchange) => {
  const notification = createNotification(exchange);

  notifier.send(users, notification);
};
