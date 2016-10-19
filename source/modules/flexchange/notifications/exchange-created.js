import moment from 'moment';
import 'moment/locale/nl';
moment.locale('nl');
import notifier from '../../../shared/services/notifier';

export const createNotification = (exchange) => {
  const date = moment(exchange.date).calendar(null, {
    sameday: '[vandaag] om HH:mm',
    nextDay: 'voor [morgen]',
    nextWeek: 'aankomende dddd',
    sameElse: 'op dddd D MMMM',
  });

  return {
    text: `Er is een nieuwe shift beschikbaar ${date}`,
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (users, exchange) => {
  const notification = createNotification(exchange);

  notifier.send(users, notification);
};
