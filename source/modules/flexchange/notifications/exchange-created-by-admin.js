import moment from 'moment';
import 'moment/locale/nl';
moment.locale('nl');
import notify from 'common/services/notifier';

export const createNotification = (exchange) => {
  const date = moment(exchange.date).format('dddd D MMMM');

  return {
    text: `Er is een shift aangeboden op ${date}, kun jij deze dienst werken?`,
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (users, exchange) => {
  const notification = createNotification(exchange);

  notify(users, notification);
};
