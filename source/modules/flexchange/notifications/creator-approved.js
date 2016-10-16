import moment from 'moment';
import 'moment/locale/nl';
import notifier from '../../../shared/services/notifier';

moment.locale('nl');

export const createNotification = (exchange, substituteUser) => {
  const date = moment(exchange.date).format('dddd D MMMM');
  const substitute = substituteUser.fullName;

  return {
    text: `Goed nieuws, je dienst van ${date} is geruild met ${substitute}. High five!`,
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (exchange) => {
  const [exchangeUser, approvedUser] = await Promise.all([
    exchange.getUser(),
    exchange.getApprovedUser(),
  ]);

  const notification = createNotification(exchange, approvedUser);

  return notifier.send([exchangeUser], notification);
};
