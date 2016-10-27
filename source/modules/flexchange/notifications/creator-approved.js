import moment from 'moment';
import 'moment/locale/nl';
import notifier from '../../../shared/services/notifier';

moment.locale('nl');

export const createNotification = (exchange) => {
  const date = moment(exchange.date).calendar(null, {
    sameday: 'op [vandaag]',
    nextDay: 'voor [morgen]',
    nextWeek: 'aankomende dddd',
    sameElse: 'op dddd DD MMMM',
  });

  return {
    text: `Er is een vervanger gevonden voor je shift ${date}`,
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (exchange) => {
  const [exchangeUser] = await Promise.all([
    exchange.getUser(),
  ]);

  const notification = createNotification(exchange);

  return notifier.send([exchangeUser], notification);
};
