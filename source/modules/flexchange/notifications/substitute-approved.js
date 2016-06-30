import moment from 'moment';
import 'moment/locale/nl';
moment.locale('nl');
import notify from 'common/services/notifier';

export const createNotification = (exchange) => {
  const creator = exchange.User.fullName;
  const date = moment(exchange.date).format('dddd D MMMM');

  return {
    text: `Goed nieuws, je hebt de shift van ${creator} overgenomen. Je werkt nu op ${date}.`,
    data: { id: exchange.id, type: 'exchange' },
  };
};

export const send = async (exchange) => {
  const approvedUser = await exchange.getApprovedUser();
  const notification = createNotification(exchange);

  return notify([approvedUser], notification);
};
